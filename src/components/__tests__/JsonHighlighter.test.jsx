import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JsonHighlighter from '../JsonHighlighter'

describe('JsonHighlighter', () => {
  it('should highlight different JSON value types', () => {
    const testJson = JSON.stringify({
      stringValue: "test string",
      numberValue: 42,
      booleanTrue: true,
      booleanFalse: false,
      nullValue: null,
      arrayValue: [1, 2, 3],
      objectValue: { nested: "value" }
    }, null, 2)

    const { container } = render(<JsonHighlighter jsonText={testJson} />)
    const html = container.innerHTML

    // Should highlight strings
    expect(html).toContain('text-green-200')
    
    // Should highlight numbers
    expect(html).toContain('text-yellow-300')
    
    // Should highlight booleans
    expect(html).toContain('text-orange-300')
    
    // Should highlight null
    expect(html).toContain('text-red-300')
    
    // Should highlight keys
    expect(html).toContain('text-blue-200')
    
    // Should highlight structural characters
    expect(html).toContain('text-gray-400')
  })

  it('should apply special highlighting to vCon sections', () => {
    const vconJson = JSON.stringify({
      vcon: "0.3.0",
      uuid: "test-uuid",
      parties: [{ name: "Test Party" }],
      dialog: [{ type: "text" }],
      analysis: [{ type: "test" }]
    }, null, 2)

    const { container } = render(<JsonHighlighter jsonText={vconJson} />)
    const html = container.innerHTML

    // Should highlight vCon section names with special colors
    expect(html).toContain('text-blue-300') // parties
    expect(html).toContain('text-green-300') // dialog
    expect(html).toContain('text-purple-300') // analysis
  })

  it('should handle empty or invalid input gracefully', () => {
    const { container: emptyContainer } = render(<JsonHighlighter jsonText="" />)
    expect(emptyContainer.textContent).toBe('')

    const { container: nullContainer } = render(<JsonHighlighter jsonText={null} />)
    expect(nullContainer.textContent).toBe('')
  })
})