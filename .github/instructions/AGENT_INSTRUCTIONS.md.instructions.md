---
applyTo: '**'
---

Before generating or modifying any code:

1. Inspect existing backend and frontend implementations related to the task.

2. Identify established patterns for:
   - API response structures (e.g., shared response wrappers or traits)
   - Error and success formats
   - Data shapes expected by the client
   - Naming conventions and typing strategies

3. Always follow these existing patterns consistently across all related changes.

4. If a backend pattern (such as a response trait, serializer, or wrapper) is already in use, ensure all new or modified endpoints conform to it and that the client code consumes the data in the same format.

5. Do NOT introduce new response formats, data contracts, or conventions unless explicitly instructed.

If any inconsistency or uncertainty exists, pause and ask for clarification before proceeding.

# OVERALL 
 Maintain uniformity in coding style, structure, and conventions throughout the codebase.