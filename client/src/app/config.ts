export interface BrowserConfig {
    requireOCRVerifier: boolean,
    allowOCRMidGameStart: boolean,
}

const ProductionConfig: BrowserConfig = {
    requireOCRVerifier: true,
    allowOCRMidGameStart: false,
}

const OCRMidGameTestConfig: BrowserConfig = {
    requireOCRVerifier: false,
    allowOCRMidGameStart: true
}

export const CONFIG = OCRMidGameTestConfig;