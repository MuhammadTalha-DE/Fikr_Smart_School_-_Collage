# Part C — Design and Execute Test Cases

**Selected feature:** Academic Subject Management  
**Test date:** 1 October 2026  
**Environment:** Running School Management System V4 API with connected `school_management` MongoDB; authenticated as admin for protected cases.  
**Execution:** Each case below was executed against the live API and database. Temporary records were deleted after verification.

| TC ID | Feature | Precondition | Input | Test Steps | Expected Result | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|
| TC-01 | View subjects | API running; admin signed in | `GET /api/subjects` | 1. Request the subject list. 2. Check response and records. | HTTP 200 with the saved subjects. | HTTP 200; 2 records returned: `B-302` and `M-301`. | Pass |
| TC-02 | Create, read, and delete subject | Admin signed in | Valid name, unique code, Theory, 3 credits | 1. Create a subject. 2. Read list and find it. 3. Delete the temporary record. | Subject is created and retrievable, then deleted. | HTTP 201; record appeared in list; cleanup delete returned HTTP 200. | Pass |
| TC-03 | Required name validation | Admin signed in | Omit `name`; provide unique code | 1. Submit create request without a name. | Reject with HTTP 400 and a required-name message. | HTTP 400: `name` is required. | Pass |
| TC-04 | Required code validation | Admin signed in | Omit `code`; provide a name | 1. Submit create request without a code. | Reject with HTTP 400 and a required-code message. | HTTP 400: `code` is required. | Pass |
| TC-05 | Minimum credit boundary | Admin signed in | Credits `0` | 1. Create a valid subject with zero credits. 2. Verify stored value. 3. Delete the temporary record. | Accept zero credits and store `0`. | HTTP 201; stored credits were `0`; cleanup delete returned HTTP 200. | Pass |
| TC-06 | Negative credit validation | Admin signed in | Credits `-2` | 1. Submit a valid subject with negative credits. 2. Read it back from MongoDB. 3. Delete the temporary record. | Reject with HTTP 400; no negative-credit subject is stored. | HTTP 201; database read returned credits `-2`. Temporary record was deleted. | **Fail** |
| TC-07 | Duplicate subject code | Existing subject `M-301` is present | Code `M-301` | 1. Submit a new subject using existing code `M-301`. | Reject duplicate code with HTTP 400; preserve existing subject. | HTTP 400 duplicate-key error. | Pass |
| TC-08 | Subject type validation | Admin signed in | Type `Online` | 1. Submit a subject with unsupported type `Online`. | Reject unsupported enum value with HTTP 400. | HTTP 400; `Online` is not a valid subject type. | Pass |
| TC-09 | Negative credit validation on update | Admin signed in | Existing temporary subject; update credits to `-3` | 1. Create a valid temporary subject. 2. Update credits to `-3`. 3. Read result and delete the subject. | Reject update with HTTP 400; credits remain non-negative. | HTTP 200; database response stored credits `-3`. Temporary record was deleted. | **Fail** |
| TC-10 | Authentication required | No authentication token | `GET /api/subjects` | 1. Request the subject list without a token. | Reject request with HTTP 401. | HTTP 401. | Pass |

## Execution summary

- **Passed:** 8 of 10
- **Failed:** 2 of 10 — TC-06 and TC-09 show that negative credits are accepted on both create and update.
- Temporary subjects created for TC-02, TC-05, TC-06, and TC-09 were deleted. The academic subject table returned to its original two records.
- The failed cases are also documented in [Part B](TEST_DEFECT_REPORT.md#part-b--identify-and-report-defects), with a screenshot of the create-flow failure in `test-evidence/academic-negative-credits-defect.png`.
