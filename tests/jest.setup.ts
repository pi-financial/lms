import '@testing-library/jest-dom'

// Values the modules under test read at import time. Real ones would make the suite depend on the
// VPN; these just have to be present and well-formed.
process.env.USER_V2_HOST = 'http://user-api-v2.test.internal'
process.env.DIRECTUS_HOST = 'http://directus.test.internal'
process.env.NEXT_PUBLIC_SIGNOZ_SERVICE_NAME = 'Pi.Lms.Test'
