# Changelog

### [Return](../README.md)

Versions
- [1.1.0](#110)

## 1.1.0

Added
- AccessControll middleware
  - Refactored ensureAccess due to new authentication system
- JSDoc comments to handlers, config & interfaces props
- Separated module for routes validation (validation, access middlewares)
- Dev-only controller for testing middlewares
- Modify users objects in db function

Removed
- ensureAccess middleware
  - Deprecated due to new authentication system

Deprecated
- Tokens service
- Auth service
- User controller

Refactored
- IUser/ITitle interfaces
- All tests that written before 1.1.0
- User roles/permissions system
- User router changed from /v1/user/* > /user/*
- User router patch changed, see PATCH /user for migration guide
- Title router changed from /v1/title/* > /title/*

### [Return](../README.md)