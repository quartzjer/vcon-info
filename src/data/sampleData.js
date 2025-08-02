export const sampleVcon = {
  "vcon": "0.0.2",
  "uuid": "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
  "parties": [
    {
      "tel": "+1-555-123-4567",
      "name": "Alice Johnson",
      "role": "customer"
    },
    {
      "tel": "+1-555-987-6543",
      "name": "Bob Smith",
      "role": "agent",
      "email": "bob.smith@support.example.com"
    }
  ],
  "dialog": [
    {
      "type": "recording",
      "start": "2024-03-15T10:23:45.123Z",
      "duration": 245.5,
      "parties": [0, 1],
      "mediatype": "audio/mp3",
      "encoding": "base64url",
      "body": "UklGRiQAAABXQVZFZm10..."
    },
    {
      "type": "text",
      "start": "2024-03-15T10:24:00.000Z",
      "duration": 30.0,
      "parties": [0],
      "mediatype": "text/plain",
      "body": "Hello, I'm calling about my order that hasn't arrived yet."
    },
    {
      "type": "text",
      "start": "2024-03-15T10:24:30.000Z",
      "duration": 45.0,
      "parties": [1],
      "mediatype": "text/plain",
      "body": "I'd be happy to help you with that. Can you please provide your order number?"
    }
  ],
  "analysis": [
    {
      "type": "transcript",
      "dialog": 0,
      "mediatype": "application/json",
      "body": {
        "vendor": "transcription-service.example",
        "confidence": 0.95,
        "language": "en-US"
      }
    },
    {
      "type": "sentiment",
      "dialog": [1, 2],
      "mediatype": "application/json",
      "body": {
        "overall": "neutral",
        "customer_satisfaction": 0.65
      }
    }
  ],
  "attachments": [
    {
      "type": "order-details",
      "mediatype": "application/pdf",
      "url": "https://example.com/orders/12345.pdf",
      "content_hash": "sha256:abcd1234..."
    }
  ]
};

export const sampleJWS = {
  "payload": "eyJ2Y29uIjoiMS4wLjAiLCJ1dWlkIjoiMDE4ZTNmNzItYzNhOC04YjhlLWI0NjgtNmViZjJlMmU4YzE0In0",
  "signatures": [
    {
      "protected": "eyJhbGciOiJSUzI1NiIsInR5cCI6InZDb24ifQ",
      "header": {
        "kid": "key-1",
        "x5u": "https://example.com/keys/public.pem"
      },
      "signature": "DtEhU3ljbEg8L38VWAfUAqOyKAM6-Xx-F4GawxaepmXFCgfTjDxw5djxLa8ISlSApmWQxfKTUJqPP3-Kg6NU01Q"
    }
  ]
};