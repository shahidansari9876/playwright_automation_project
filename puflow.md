# PU Semester Exam Flow — Test Script

End-to-end walkthrough of the PU Semester Exam journey: beneficiary registration and request creation, volunteer registration and acceptance, admin/COE verification, exam completion, and volunteer payout.

## Contents

1. [Beneficiary Side (Creates the Exam Request)](#1-beneficiary-side-creates-the-exam-request)
2. [Volunteer Side (Accepts and Completes the Request)](#2-volunteer-side-accepts-and-completes-the-request)
3. [PU Verification (COE Process)](#3-pu-verification-coe-process)
4. [Exam Completion Process](#4-exam-completion-process)
5. [Volunteer Payout Process](#5-volunteer-payout-process)
6. [Test Environment & Credentials](#6-test-environment--credentials)

---

## 1. Beneficiary Side (Creates the Exam Request)

### 1.1 Sign Up & Registration

- [ ] Sign up using your email address and phone number.
- [ ] Enter the OTP received on both your email and phone number.
- [ ] Select **Register as Beneficiary**.
- [ ] Enter your personal details:
  - Full Name
  - Gender
  - Date of Birth
- [ ] Fill in your Education Details.
- [ ] Fill in your Institution Details:
  - If **"Others"** is selected:
    - Enter School/College Name.
    - Enter Board/University Name.
  - If **"PU"** is selected:
    - Select Student Type.
    - Select School/College Name from the dropdown.
    - Enter PU Enrollment Number.
      - *Mandatory for 2nd Year and above.*
      - *Optional for 1st Year.*
- [ ] Fill in your Current Address Details.
- [ ] Accept the Terms & Conditions and click **Submit**.

### 1.2 Complete Profile Setup

> Profile completion is mandatory before creating any request.

- [ ] Upload Identity Document.
- [ ] Upload Disability Certificate (verify and complete all fields).
- [ ] Upload Professional Photo.

### 1.3 Admin Verification Process

- After profile setup, all uploaded documents go into **Under Review** status.
- [ ] Admin reviews and approves/rejects the Identity Document.
- [ ] Admin reviews and verifies the Professional Photo.
- [ ] Admin reviews and approves the Disability Certificate.

### 1.4 Create PU Semester Exam Request

> Once all documents are approved, the beneficiary can create a new request.

- [ ] Click **New Request**.
- [ ] Select **PU Semester Exam** and enter the following details:
  - Select Exam Category.
  - Select Semester Number.
  - Enter Exam Title.
  - Select Medium of Examination.
  - Upload Admit Card/Hall Ticket.
  - Enter Exam Centre Address.
  - Add Exam Details:
    - Subject Name
    - Exam Date
    - Exam Time

---

## 2. Volunteer Side (Accepts and Completes the Request)

### 2.1 Sign Up & Registration

- [ ] Sign up using your email address and phone number.
- [ ] Enter the OTP received on both your email and phone number.
- [ ] Select **Register as Volunteer**.
- [ ] Enter your personal details:
  - Full Name
  - Gender
  - Date of Birth
- [ ] Fill in your Education Details.
- [ ] Fill in your Institution Details:
  - If **"Others"** is selected:
    - Enter School/College Name.
    - Enter Board/University Name.
  - If **"PU"** is selected:
    - Select Student Type.
    - Select School/College Name from the dropdown.
    - Enter PU Enrollment Number.
      - *Mandatory for 2nd Year and above.*
      - *Optional for 1st Year.*
- [ ] Fill in your Current Address Details.
- [ ] Accept the Terms & Conditions and click **Submit**.

### 2.2 Complete Profile Setup

> Profile completion is mandatory before accepting any request.

- [ ] Upload Identity Document.

### 2.3 Admin Identity Verification

- The uploaded identity document goes into **Under Review** status.
- [ ] Admin reviews and approves/rejects the identity document.

#### Rejection Flow Demonstration

- [ ] Show what happens when the document is rejected.
- [ ] Display the rejection reason on the volunteer/beneficiary profile.
- [ ] User uploads the corrected document.
- [ ] Submit the document again for verification.
- [ ] Admin reviews the re-uploaded document and approves it.

### 2.4 Accept PU Semester Exam Request

> After approval, the volunteer can accept a PU Semester Exam request.

- [ ] Upload Professional Photo.
- [ ] Upload Highest Education Certificate.
- [ ] Admin verifies the Professional Photo.
- Once the Professional Photo is approved, the volunteer becomes eligible to accept the PU Semester Exam.

---

## 3. PU Verification (COE Process)

- After the volunteer accepts the exam request, the request moves to **COE Verification**.
- [ ] Admin reviews the exam details and starts the PU verification process.
- [ ] Admin verifies the uploaded documents and Permission Letter.
- [ ] During the COE Verification Checklist, the admin verifies or rejects the request.

### 3.1 If COE Rejects the Request

- [ ] Identify whether the mistake belongs to:
  - Beneficiary
  - Volunteer
  - Both
- [ ] Enter the rejection reason.
- [ ] Select one of the following rejection paths:

| Path | Request State | Volunteer | Next Step |
|---|---|---|---|
| **Reject & Hold** | Remains **Accepted** | Not removed | Beneficiary/Volunteer must correct the rejected items and resubmit. |
| **Reject & Release** | Moves back to **New** | Removed from the request | Request re-enters the pool for a new volunteer to accept. |

### 3.2 Rejection Demonstration & Resubmission

- [ ] Show the rejection reason on both:
  - Beneficiary side
  - Volunteer side
- [ ] Beneficiary or Volunteer corrects the issue.
- [ ] Resubmit the PU verification.
- [ ] COE reviews the request again and verifies it.
- After successful verification, both the beneficiary and volunteer can download the **PU Verification Performa**.

---

## 4. Exam Completion Process

> After the examination is completed on the scheduled date and time:

- [ ] Volunteer clicks **Create Completion Request**.
- [ ] Upload the required completion documents:
  - Scribe Performa, or
  - Selfie with the Beneficiary (as applicable).
- [ ] Submit your experience by:
  - Rating the experience.
  - Adding notes.
- [ ] Beneficiary reviews the completion request and either:
  - Marks it as **Completed**, or
  - Rejects it for clarification.
- Once the beneficiary marks the request as **Completed**, the workflow proceeds to payout.

---

## 5. Volunteer Payout Process

- [ ] Volunteer clicks **Create Payout Request**.
- [ ] If no bank account exists, click **Add Account** and enter the following bank details:
  - Account Holder Name
  - Bank Name
  - Account Number
  - IFSC Code
  - Branch Name
  - Account Type (if applicable)
- [ ] Submit.
- [ ] Admin reviews and approves the volunteer's bank account details.
- After bank verification is approved, the volunteer can successfully submit a Payout Request.

---

## 6. Test Environment & Credentials

### Superadmin

| Field | Value |
|---|---|
| URL | https://adminpanel-testing.thescribebank.com/?masterOtp=true |
| Email | shahid.asnari@ledsak.ai |
| OTP | 123456 |

### Beneficiary / Volunteer Sign-up

Use random/disposable credentials for each sign-up.

### Test Documents

| Document | File Path |
|---|---|
| Identity Document | `images/idnentity imae.jpg` |
| Disability Certificate | `images/disability certificate.png` |
| Professional Photo | `images/professional pic.jpg` |
| Admit Card / Hall Pass | `images/hall pass.jpg` |
| Scribe Performa | `images/selfie with the scribe performa.jpg` |

> Note: file names above match the actual files in `images/` (including the existing typo in the identity document filename) — keep as-is so paths resolve correctly.
