import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_ALFAJORES_RPC_URL = 'https://alfajores-forno.celo-testnet.org'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}
