# Part D — Black-Box Testing

The five cases below are selected from the ten executed Academic Subject Management tests in [Part C](PART_C_TEST_CASES.md). They are black-box tests because each case is judged by the action submitted to the running system and the response or saved data observed afterward; none requires access to the system's internal code.

| Test Case ID | Input / Action | Expected Result | Actual Result | Pass/Fail | Why this is black-box testing |
|---|---|---|---|---|---|
| TC-02 | As an authenticated admin, create a subject with a unique code and valid name, type, and credits; retrieve it; then delete the temporary record. | The subject is created and appears in the list, then can be deleted. | Create returned HTTP 201, the new subject appeared in the list, and cleanup returned HTTP 200. | Pass | The test observes the result of user actions through the app's responses and displayed data. It does not depend on how subject creation or storage is implemented. |
| TC-03 | Submit a new subject without a name, while supplying a unique code. | The app rejects the request and reports that the name is required. | HTTP 400; the response reported that `name` is required. | Pass | The test supplies invalid input and checks the visible response. It does not inspect the validation code or database schema. |
| TC-05 | Create a subject with credits set to `0`, verify the stored value, and delete the temporary record. | Zero is accepted and remains zero. | HTTP 201; the returned subject had credits `0`; cleanup returned HTTP 200. | Pass | This is an input-boundary test. It checks the observable response and saved value without relying on internal calculations or code. |
| TC-06 | Submit a subject with credits set to `-2`, then check whether it was saved. | The app rejects the negative value and does not save the subject. | HTTP 201; the subject was saved with credits `-2`. The temporary record was then deleted. | Fail | The test checks the externally visible result for an invalid input. The failure is established by the response and persisted value, not by examining the implementation. |
| TC-10 | Request the subject list without signing in or providing an authentication token. | The app denies access with HTTP 401. | HTTP 401. | Pass | The test checks the system's observable access-control response for an unauthenticated request; it does not rely on the authentication mechanism's internal design. |

## Summary

These cases cover a valid workflow, a required-field error, a boundary value, an invalid numeric value, and an unauthenticated request. Each test treats the application as a black box: provide an input or action, then compare the observed result with the expected result. The outcomes are the same as those recorded during execution in Part C.
