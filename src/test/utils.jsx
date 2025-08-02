import React from 'react'
import { render } from '@testing-library/react'

export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => {
    return children
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

export const createMockVcon = (overrides = {}) => ({
  vcon: "0.0.1",
  uuid: "test-uuid-123",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  subject: "Test vCon",
  parties: [
    {
      tel: "+1234567890",
      name: "Test Party"
    }
  ],
  dialog: [],
  analysis: [],
  attachments: [],
  ...overrides
})

export const createInvalidVcon = () => ({
  invalid: "data",
  missing: "required fields"
})