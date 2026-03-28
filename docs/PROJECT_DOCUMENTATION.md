# 🏥 MediVerify - Comprehensive Project Documentation

## 1. Project Overview

**MediVerify** is an advanced, AI-powered full-stack platform designed to verify the authenticity of medical images such as X-rays, CT scans, and MRIs. It detects whether an uploaded medical image is **GENUINE** or has been **MANIPULATED** (tampered with or forged). 

As medical records and imaging can be altered for insurance fraud or misdiagnosis, MediVerify serves as a robust defense line by employing Deep Learning and Explainable AI (XAI) to not only predict tampering but also visually highlight the suspected forged regions.

---

## 2. Problem Solving Approach

The project solves the problem of medical image forgery through a multi-layered approach:

1.  **Deep Learning Classification**: Uses an **EfficientNetB0** Convolutional Neural Network (CNN) to detect microscopic and structural anomalies introduced during image manipulation, which are often invisible to the naked eye.
2.  **Explainability (XAI)**: A "black box" AI is hard for medical professionals to trust. MediVerify integrates **Grad-CAM (Gradient-weighted Class Activation Mapping)** to generate heatmaps that overlay on the original image, explicitly showing *where* the AI found suspicious patterns.
3.  **Efficiency & Deduplication**: To save computing power and response time, the backend calculates an SHA-256 hash of the uploaded image. If the hash matches an already processed image in the Supabase database, it serves a **Cache Hit**, instantly returning the previous AI result without re-running the heavy neural network.
4.  **Security & Compliance**: Role-Based Access Control (RBAC) ensures only authorized personnel (Doctors) can upload images, while Administrators monitor the whole system. All critical actions (logins, verifications) are stored in an Audit Log for compliance.

---

## 3. System Architecture & Tech Stack

### Frontend (User Interface)
- **Framework**: React 19 with TypeScript, built via Vite.
- **Styling**: Tailwind CSS for a premium, responsive modern UI.
- **State Management**: Zustand.
- **Animations**: Framer Motion for page transitions and micro-interactions.
- **File Handling**: `react-dropzone` for drag-and-drop uploads, `react-easy-crop` for potential image cropping.
- **Routing**: React Router with Protected Routes based on user roles (`doctor`, `admin`).
- **Monitoring**: Sentry for frontend error tracking.

### Backend (API & Processing)
- **Framework**: Python FastAPI.
- **Asynchronous & Fast**: Uses modern ASGI standards for fast I/O.
- **Rate Limiting**: `slowapi` restricts the number of API calls a user can make to prevent DoS attacks.
- **AI/ML Engine**: TensorFlow/Keras and OpenCV (`cv2`) for image processing and inference.
- **Analytics/Reporting**: Includes functionality to generate downloadable PDF verification reports.

### Database & Authentication
- **Provider**: Supabase.
- **Authentication**: JWT-based authentication managed by Supabase Auth.
- **Storage**: Supabase Storage buckets for saving uploaded heatmaps and profile pictures.
- **Database**: PostgreSQL (via Supabase) storing users, image validation records, and audit logs.

---

## 4. Machine Learning Model details

### 4.1. Core Model
The system uses **EfficientNetB0** pre-trained on **ImageNet**, acting as the base feature extractor. The top layer is replaced by:
- A `GlobalAveragePooling2D` layer.
- A Dense layer with 512 neurons (ReLU activation).
- A final Dense layer with 1 neuron (Sigmoid activation) for binary classification (`0` = Genuine, `1` = Manipulated).

### 4.2. Dataset & Training Process
*Note: Due to the size of medical datasets, the actual training is intended to be executed externally in Google Colab (referenced in `ml/notebooks/`).*

- **Dataset Characteristics**: The dataset consists of high-resolution medical images divided into two distinct classes: Genuine and Manipulated (spliced, cloned, or AI-generated anomalies). 
- **Preprocessing Pipeline**: 
  1. Images are read as bytes and decoded via OpenCV.
  2. Converted to RGB color space.
  3. Resized specifically to **224x224 pixels** to match EfficientNetB0's required input shape.
  4. (Optional/Historical) Application of **CLAHE** (Contrast Limited Adaptive Histogram Equalization) to enhance the structural contrast of X-rays.
  5. Scaled using EfficientNet's built-in `preprocess_input` function.
- **Training Strategy**:
  - **Loss Function**: Binary Cross-Entropy.
  - **Optimizer**: Adam.
  - **Metrics tracked**: Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
- **Evaluation Split**: 
  - Standard splits (e.g., 80% Train, 10% Validation, 10% Test) are configured in the Colab training pipeline. 
  - The currently deployed TensorFlow `.h5` model achieves an estimated **99.5% accuracy** on the test set.

### 4.3. Inference & Explainability (Grad-CAM)
When an image is verified by a Doctor:
1. The backend loads the `.h5` model file and a predefined confidence threshold (default `0.5`, configured in `config.json`).
2. The image runs through the CNN, outputting a probability between 0 and 1.
3. If probability > threshold, verdict is **MANIPULATED**; else **GENUINE**.
4. **Grad-CAM** extracts the gradients of the target class from the last convolutional layer (`top_conv`). It computes a weighted combination of feature maps to create a rough heatmap.
5. The heatmap is normalized, resized to the original image dimensions, colored using a Jet colormap (`cv2.COLORMAP_JET`), and superimposed with an alpha blend over the original image, visually pointing out the tampered zones.

---

## 5. Backend Implementation Deep Dive

The backend architecture is highly modularized under the `backend/` directory:

- `main.py`: The FastAPI application entry point. Initializes CORS, Sentry, Rate limiting, and imports the routers.
- **Routes (`backend/routes/`)**:
  - `auth.py`: Handles login/logout and token verification.
  - `doctor.py`: Contains the core `/verify` endpoint. It handles file validation (>10MB rejection), duplicate checking (hash collision), invokes `ml_service`, generates Grad-CAM via `gradcam_service`, saves the record to Supabase, logs the audit trail, and generates PDF reports.
  - `admin.py`: Endpoints for fetching user logs, system analytics, and managing doctor accounts.
- **Services (`backend/services/`)**:
  - `ml_service.py`: Singleton-like loader for the TensorFlow model to prevent reloading on every request. Processes inferences.
  - `gradcam_service.py`: Generates the Grad-CAM heatmap and uploads it to Supabase storage natively, returning a public URL.
  - `hash_service.py`: Uses SHA-256 to hash image bytes for exact-match caching.
  - `report_service.py`: Utility to generate downloadable PDF certificates of the verification run.
- **Middleware**: Includes `auth_check.py` to ensure only valid JWT tokens can access protected routes, mapping tokens to Database Roles, and `audit_log.py` for asynchronous trail tracking.

---

## 6. Frontend Implementation Deep Dive

The frontend resides in `frontend/src/` and emphasizes a frictionless User Experience:

- `App.tsx`: Determines the routing layout. It uses `<AnimatePresence>` for smooth page switching and employs `<ProtectedRoute>` to block unauthorized access.
- **State (`context/` & `hooks/`)**: Maintains user session status, authentication tokens, and profile data locally, syncing with Supabase Auth real-time.
- **Doctor Flows**:
  - **Dashboard**: High-level statistical view of previous scans.
  - **Upload (`Upload.tsx`)**: Utilizes Drag-and-Drop. Once dropped, an API call is made to the backend `/verify` endpoint. A loading skeleton is shown during the 1-2 second inference delay.
  - **Result (`Result.tsx`)**: Fetches the Result ID, showing the verdict. A beautiful toggle or hover mechanism displays the AI's Grad-CAM heatmap on top of the original structure.
  - **History (`History.tsx`)**: Fetches paginated past records to track the Doctor's activity.
- **Admin Flows**:
  - **Analytics (`Analytics.tsx`)**: Uses `recharts` to render line/bar graphs of system usage, number of manipulated detections over time, and accuracy metrics.
  - **Users & Logs**: Interfaces to revoke Doctor access and view every single system touchpoint via the audit table layout.

---

## 7. Security Highlights

1. **Authentication**: Handled purely by Supabase, so passwords are never stored in plaintext on the FastAPI server.
2. **Data Isolation**: Row Level Security (RLS) in Supabase ensures Doctors can only query `image_records` belonging to their specific `doctor_id`.
3. **Payload Limits**: FastAPI strictly validates file sizes (`MAX_FILE_SIZE = 10MB`) and MIME types before pushing any bytes into RAM or through the ML model.

*End of Documentation*
