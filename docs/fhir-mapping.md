# FHIR mapping notes

The demo creates a FHIR R4 `Bundle` with `type: collection`. It contains one `Patient` and zero or more vital-sign `Observation` resources.

## Patient

- Fitbit `encodedId` → `Patient.identifier.value`
- Fitbit `displayName` → `Patient.name.text`
- Fitbit `gender` → `Patient.gender`
- Fitbit `dateOfBirth` → `Patient.birthDate`

The mapping is intentionally direct for a classroom prototype. A real system must match the Fitbit user to the hospital's master patient index rather than treating the Fitbit ID as a medical-record identifier.

## Observations

| Measurement | LOINC | UCUM |
| --- | --- | --- |
| Body height | `8302-2` | `cm` |
| Body weight | `29463-7` | `kg` |
| Heart rate | `8867-4` | `/min` |

## Production considerations

- Validate resources against the receiver's implementation guide.
- Confirm patient identity and consent.
- Preserve measurement timestamps and provenance.
- Distinguish device readings from patient-entered profile values.
- Use TLS, server authentication, authorization, audit logging, and secure token storage.
- Avoid sending raw Fitbit payloads when only a smaller clinical subset is needed.
