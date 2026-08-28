# Playwright Test Case – New Exam Completion and Volunteer Payout Flow

## Test Case 1: Create and Process a New Exam

**Test Case Name:** Create and process a new exam from Beneficiary to Volunteer

**Precondition:**

- One beneficiary and one volunteer account should already be created.
- Use the same account for beneficiary and volunteer login as mentioned in the test flow.
- Required test documents should be available.

| Step        | Action                                                                                              | Expected Result                                                               |
| ----------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Step 1**  | Take any one volunteer and beneficiary that you have created when you have taken sign-up.           | Existing volunteer and beneficiary are available for testing.                 |
| **Step 2**  | Login to the beneficiary profile.                                                                   | Beneficiary profile is successfully logged in.                                |
| **Step 3**  | Add a new request that is not the PU Semester Check-In.                                             | A new request is created with a request type other than PU Semester Check-In. |
| **Step 4**  | Create an exam with all details.                                                                    | Exam is successfully created with all required details.                       |
| **Step 5**  | After successful creation, check that it is not PU Semester with the tag name.                      | Created exam shows the correct tag name and is not marked as PU Semester.     |
| **Step 6**  | Login as volunteer.                                                                                 | Volunteer profile is successfully logged in.                                  |
| **Step 7**  | Accept the exam.                                                                                    | Volunteer successfully accepts the created exam.                              |
| **Step 8**  | Set all the process.                                                                                | All required process steps are successfully completed.                        |
| **Step 9**  | Go to the admin side.                                                                               | Admin side is successfully opened.                                            |
| **Step 10** | Find the same created exam.                                                                         | The same exam created from the beneficiary side is displayed.                 |
| **Step 11** | Hit the same exam and set **Ended QA**.                                                             | The exam status is successfully set to **Ended QA**.                          |
| **Step 12** | After setting **Ended QA**, process with the volunteer side and beneficiary side for the same exam. | The same exam can be processed from both volunteer and beneficiary sides.     |

---

# Test Case 2: Exam Completion Process

**Test Case Name:** Complete the exam after the scheduled examination

| Step        | Action                                                                                                     | Expected Result                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Step 13** | After the examination is completed on the scheduled date and time.                                         | Examination is completed on the scheduled date and time.                            |
| **Step 14** | Volunteer clicks **Create Completion Request**.                                                            | Completion Request screen is opened.                                                |
| **Step 15** | Upload the required completion documents: Scribe Performa, or Selfie with the Beneficiary (as applicable). | Required completion document is successfully uploaded.                              |
| **Step 16** | Submit your experience by rating the experience.                                                           | Experience rating is successfully added.                                            |
| **Step 17** | Add notes.                                                                                                 | Notes are successfully added.                                                       |
| **Step 18** | Submit the completion request.                                                                             | Completion request is successfully submitted.                                       |
| **Step 19** | Beneficiary reviews the completion request.                                                                | Beneficiary can view the submitted completion request.                              |
| **Step 20** | Beneficiary marks it as **Completed**, or rejects it for clarification.                                    | Completion request is either marked as **Completed** or rejected for clarification. |
| **Step 21** | Once the beneficiary marks the request as **Completed**.                                                   | Workflow proceeds to payout.                                                        |

---

# Test Case 3: Volunteer Payout Process

**Test Case Name:** Create and process Volunteer Payout Request
required action , check if already added the payment details than not procedd all follow just check if added than click on default and proceed,
if payment bank details is not approved than go to admin panel find the same voluntee and approve the payment details
and proceed the following furthure action,

if not added than once the complete the payout payment request,

| Step        | Action                                                                       | Expected Result                                               |
| ----------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Step 22** | Volunteer clicks **Create Payout Request**.                                  | Payout Request screen is opened.                              |
| **Step 23** | Check whether a bank account exists.                                         | Existing bank account details are displayed if already added. |
| **Step 24** | If no bank account exists, click **Add Account**.                            | Add Account screen is opened.                                 |
| **Step 25** | Enter **Account Holder Name**.                                               | Account Holder Name is entered successfully.                  |
| **Step 26** | Enter **Bank Name**.                                                         | Bank Name is entered successfully.                            |
| **Step 27** | Enter **Account Number**.                                                    | Account Number is entered successfully.                       |
| **Step 28** | Enter **IFSC Code**.                                                         | IFSC Code is entered successfully.                            |
| **Step 29** | Enter **Branch Name**.                                                       | Branch Name is entered successfully.                          |
| **Step 30** | Enter **Account Type**, if applicable.                                       | Account Type is entered successfully.                         |
| **Step 31** | Submit the bank account details.                                             | Bank account details are successfully submitted.              |
| **Step 32** | Admin reviews the volunteer's bank account details.                          | Admin can review the submitted bank account details.          |
| **Step 33** | Admin approves the volunteer's bank account details.                         | Bank account details are successfully approved.               |
| **Step 34** | After bank verification is approved, volunteer submits a **Payout Request**. | Volunteer can successfully submit the Payout Request.         |

---

# Test Case 4: Admin Payout Completion

**Test Case Name:** Admin marks the volunteer payout as Completed, and volunteer confirms it

| Step        | Action                                                                                                                    | Expected Result                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Step 35** | Admin opens the **Payouts** section.                                                                                        | Payouts list is displayed.                                              |
| **Step 36** | Admin finds the payout request for the same exam.                                                                           | The matching payout request is found.                                   |
| **Step 37** | Admin opens **Edit payment** for that payout.                                                                               | Edit Payout Request dialog opens, showing Current Status as **Requested**. |
| **Step 38** | Admin keeps the notification checkboxes selected, sets Payment Status to **Completed**, enters a Transaction ID, and clicks **Update Payment**. | Payout status is updated to **Completed**.                              |
| **Step 39** | Volunteer opens the **Payouts** tab.                                                                                         | Payout list is displayed for the volunteer.                             |
| **Step 40** | Volunteer checks the payment status for the same exam.                                                                      | Payment status shows **Completed**.                                     |

---

# Test Data / Test Documents if needed take from here all the documents

| Document               | File Path                                    |
| ---------------------- | -------------------------------------------- |
| Identity Document      | `images/idnentity imae.jpg`                  |
| Disability Certificate | `images/disability certificate.png`          |
| Professional Photo     | `images/professional pic.jpg`                |
| Admit Card / Hall Pass | `images/hall pass.jpg`                       |
| Scribe Performa        | `images/selfie with the scribe performa.jpg` |

---

# Playwright Test Flow Order

The Playwright automation should follow this order:

1. Use the already-created beneficiary and volunteer.
2. Login as beneficiary.
3. Create a new request that is not PU Semester Check-In.
4. Create the exam with all details.
5. Verify the exam is not PU Semester using the tag name right side of exam title.
6. Login as volunteer.
7. Accept the exam.
8. Set all the process.
9. Login/go to admin side.
10. Find the same exam.
11. Set the exam to **Ended QA**.
12. Continue the same exam process from volunteer and beneficiary sides.
13. Complete the examination on the scheduled date and time.
14. Volunteer creates a **Completion Request**.
15. Upload the required completion document.
16. Add experience rating and notes.
17. Submit the Completion Request.
18. Beneficiary reviews the Completion Request.
19. Beneficiary marks it **Completed** or rejects it for clarification.
20. Once marked **Completed**, proceed to payout.
21. Volunteer creates a **Payout Request**.
22. Add bank account if no bank account exists.
23. Submit bank details.
24. Admin reviews and approves the bank account.
25. Volunteer submits the **Payout Request**.
26. Verify that the Payout Request is successfully submitted.
27. Admin processes the payout after it is submitted.
28. Admin opens the **Payouts** section and finds the payout request for the same exam.
29. Admin opens **Edit payment** for that payout.
30. Admin checks the payment status shows **Requested**.
31. Admin keeps the notification checkboxes selected, sets the status to **Completed**, enters a Transaction ID, and updates the payment.
32. Volunteer opens their **Payouts** tab.
33. Volunteer verifies the payment status for the same exam shows **Completed**.
