# Part B — Identify and Report Defects

**Application tested:** School Management System V4  
**Test date:** 1 October 2026 (Asia/Karachi)  
**Test method:** Authenticated, manual browser testing against the running React app, Express API, and connected MongoDB database.  
**Modules exercised:** Academic Subjects, Academic Calendar, Document Template Builder, and Certificate Generator.

| # | Feature | Input / Action | Expected Result | Actual Result | Defect Type | Evidence |
|---:|---|---|---|---|---|---|
| 1 | Academic — Subjects | In the subject form, enter a new subject with credits `-2` and save. | Reject a negative credit value and leave the subject list unchanged. | The app showed “Subject created”; the database stored the subject with credits `-2`. The QA record was then deleted. | Functional / input validation | [Screenshot](test-evidence/academic-negative-credits-defect.png) |
| 2 | Academic — Sessions | Create a session with start `31 Oct 2026`, end `1 Oct 2026`; set its term start to `30 Oct 2026` and end to `2 Oct 2026`. | Reject dates where an end date precedes its start date. | The session and term saved with both date ranges reversed. The QA record was then deleted. | Functional / input validation | [Screenshot](test-evidence/academic-reversed-session-dates-defect.png) |
| 3 | Documents — Certificate templates | Choose Bonafide in Certificate Generator; inspect the active template named “Professional Bonafide Certificate.” | The active Bonafide template should be selectable for a Bonafide certificate. | The active template is stored/displayed as type `character`; the Bonafide generator has no matching template and says to create and activate one. | Functional / template configuration | [Template screenshot](test-evidence/document-template-builder.png); [Generator screenshot](test-evidence/certificate-generator-blocked.png) |
| 4 | Documents — Certificate issue date | Open Certificate Generator on 1 Oct 2026 in the Asia/Karachi timezone. | Default the issue date to the current local date, `1 Oct 2026`. | The date field defaults to `30 Sep 2026`, one day earlier. | Functional / date-time handling | [Screenshot](test-evidence/certificate-generator-blocked.png) |
| 5 | Academic — Subject department data | Open Subjects and inspect Biology (`B-302`). | Display the department with the school’s correct spelling (for example, “Pre-Medical”). | The database-backed row displays `Pre midical`. | Data / content accuracy | [Screenshot](test-evidence/academic-subjects.png) |
| 6 | Academic — Subject department data | Open Subjects and inspect Math (`M-301`). | Display “Computer Science” correctly. | The database-backed row displays `Computer Scinece`. | Data / content accuracy | [Screenshot](test-evidence/academic-subjects.png) |

## Test notes

- The app health endpoint returned HTTP 200 and reported MongoDB as connected. The frontend and authenticated module pages loaded successfully.
- The negative-credit and reversed-date cases were submitted through the real UI and verified in the database. Both temporary QA records were deleted afterward; cleanup verification found zero QA records.
- Certificate generation could not be completed in this database setup. The generator requires a compatible active template, a principal name, and a principal signature. The Bonafide template mismatch and missing profile fields prevent PDF creation. The generated-document count remained unchanged during the check.
- Screenshots are saved in `test-evidence/`. No source code or permanent school records were changed.
