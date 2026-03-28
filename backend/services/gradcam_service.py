import numpy as np
import cv2
import tensorflow as tf
import logging
import os
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

def find_last_conv_layer(model):
    """
    Find the last Conv2D layer in the model.
    """
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.Conv2D):
            return layer.name
        # Check inside nested models (like EfficientNet base)
        if hasattr(layer, 'layers'):
            last_conv = find_last_conv_layer(layer)
            if last_conv:
                return last_conv
    return None

def generate_gradcam(model, img_array, intensity=0.5):
    """
    Generate Grad-CAM heatmap overlay for EfficientNetB0.
    """
    try:
        # 1. Find the last conv layer
        # For EfficientNetB0, it's usually 'top_activation' or the last conv in the base model
        # We'll use a robust search
        last_conv_layer_name = find_last_conv_layer(model)
        if not last_conv_layer_name:
            logger.error("Could not find a Conv2D layer in the model")
            return None

        # 2. Create a model that maps the input image to the activations 
        # of the last conv layer as well as the output predictions
        grad_model = tf.keras.models.Model(
            [model.inputs], [model.get_layer(last_conv_layer_name).output, model.output]
        )

        # 3. Compute the gradient of the top predicted class for our input image
        # with respect to the activations of the last conv layer
        with tf.GradientTape() as tape:
            last_conv_layer_output, preds = grad_model(img_array)
            # Binary classification: we just take the single output
            class_channel = preds[:, 0]

        # 4. This is the gradient of the output neuron with regard to the output feature map of the last conv layer
        grads = tape.gradient(class_channel, last_conv_layer_output)

        # 5. This is a vector where each entry is the mean intensity of the gradient over a specific feature map channel
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        # 6. We multiply each channel in the feature map array by "how important this channel is" 
        # with regard to the top predicted class, then sum all the channels to obtain the heatmap class activation
        last_conv_layer_output = last_conv_layer_output[0]
        heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        # 7. For visualization purpose, we will also normalize the heatmap between 0 & 1
        heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
        heatmap = heatmap.numpy()

        # 8. Resize and Overlay
        # Original image (img_array is preprocessed, let's reverse or use original)
        # For simplicity, we'll just show the heatmap. 
        # In a real scenario, we'd overlay it on the original RGB image.
        
        # Rescale heatmap to 0-255
        heatmap = np.uint8(255 * heatmap)
        
        # Use jet colormap to colorize heatmap
        jet = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        jet = cv2.resize(jet, (224, 224))
        
        return jet

    except Exception as e:
        logger.error(f"❌ Grad-CAM generation failed: {e}")
        return None

def generate_and_upload_heatmap(model, img_array, original_image_bytes, supabase_client=None):
    """
    Generates overlay and saves locally/uploads to Supabase.
    """
    try:
        heatmap = generate_gradcam(model, img_array)
        if heatmap is None:
            return None

        # Decode original image for overlay
        nparr = np.frombuffer(original_image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img = cv2.resize(img, (224, 224))

        # Superimpose
        overlay = cv2.addWeighted(img, 0.6, heatmap, 0.4, 0)
        
        # Save to local static directory
        temp_filename = f"gradcam_{uuid.uuid4()}.jpg"
        static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "heatmaps")
        os.makedirs(static_dir, exist_ok=True)
        local_path = os.path.join(static_dir, temp_filename)
        cv2.imwrite(local_path, overlay)

        # Local URL for testing
        local_url = f"/static/heatmaps/{temp_filename}"
        
        # Optionally upload to Supabase if client is provided
        if supabase_client:
            try:
                with open(local_path, 'rb') as f:
                    storage_path = f"heatmaps/{datetime.now().strftime('%Y%m%d')}/{temp_filename}"
                    supabase_client.storage.from_("mediverify").upload(
                        path=storage_path,
                        file=f,
                        file_options={"content-type": "image/jpeg"}
                    )
                # If upload succeeds, we can return the public URL
                public_url = supabase_client.storage.from_("mediverify").get_public_url(storage_path)
                return public_url
            except Exception as e:
                logger.warning(f"⚠️ Supabase upload failed, falling back to local URL: {e}")
            
        return local_url

    except Exception as e:
        logger.error(f"❌ Heatmap generation failed: {e}")
        return None
