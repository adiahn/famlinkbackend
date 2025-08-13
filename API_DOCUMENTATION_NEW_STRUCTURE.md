# FamTree API Documentation - New Family Tree Structure

## Overview
This document outlines the new API endpoints and changes implemented for the enhanced family tree structure where:
- Users can create family trees for their parents' family or their own family
- Father is positioned at the top with mothers below
- Children are explicitly grouped under their respective mothers
- Family linking creates complete tree integration

## Base URL
```
http://your-domain/api
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## New Endpoints

### 1. Initialize Family Creation
**Endpoint:** `POST /api/families/initialize-creation`

**Description:** Initialize the family creation process with a specific type (own family or parents family).

**Request Body:**
```json
{
  "creationType": "own_family" | "parents_family",
  "familyName": "string" // Optional, auto-generated if not provided
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Family creation initialized",
  "data": {
    "familyId": "uuid",
    "creationType": "string",
    "currentStep": "initialized",
    "nextStep": "parent_setup"
  }
}
```

**Error Responses:**
- `400 CONFLICT`: User already has an active family creation flow
- `500 INTERNAL_ERROR`: Failed to initialize family creation

---

### 2. Setup Parents
**Endpoint:** `POST /api/families/:familyId/setup-parents`

**Description:** Setup father and mothers for a family, creating the foundation structure.

**Request Body:**
```json
{
  "father": {
    "firstName": "string",
    "lastName": "string",
    "birthYear": "string (YYYY)",
    "isDeceased": "boolean",
    "deathYear": "string (YYYY)" // Required if isDeceased is true
  },
  "mothers": [
    {
      "firstName": "string",
      "lastName": "string",
      "birthYear": "string (YYYY)",
      "isDeceased": "boolean",
      "deathYear": "string (YYYY)", // Required if isDeceased is true
      "spouseOrder": "number" // Sequential order starting from 1
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Parents setup completed",
  "data": {
    "family": {
      "id": "uuid",
      "name": "string",
      "creationType": "string",
      "currentStep": "parent_setup"
    },
    "father": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "birthYear": "string",
      "isDeceased": "boolean",
      "deathYear": "string"
    },
    "mothers": [
      {
        "id": "uuid",
        "firstName": "string",
        "lastName": "string",
        "birthYear": "string",
        "isDeceased": "boolean",
        "deathYear": "string",
        "spouseOrder": "number"
      }
    ],
    "branches": [
      {
        "id": "uuid",
        "name": "string",
        "order": "number"
      }
    ]
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Age validation failed, spouse order invalid
- `403 AUTHORIZATION_ERROR`: User can only setup parents for their own family
- `500 INTERNAL_ERROR`: Failed to setup parents

**Validation Rules:**
- Father must be older than all mothers
- Spouse order must be sequential starting from 1
- At least one mother is required

---

### 3. Enhanced Member Addition (Unified Endpoint)
**Endpoint:** `POST /api/families/:familyId/members`

**Description:** Add any type of family member (father, mother, or child) with enhanced logic for child assignment to mothers and branches.

**Request Body:**
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "relationship": "string (required)",
  "birthYear": "string (required, YYYY)",
  "isDeceased": "boolean (default: false)",
  "deathYear": "string (YYYY) - required if isDeceased is true",
  "motherId": "string (optional) - ID of the mother when adding children",
  "parentType": "string (optional) - 'father', 'mother', or 'child'"
}
```

**Enhanced Logic:**
- **Automatic Detection**: `parentType` and `isRootMember` are automatically determined based on `relationship` field
- **Conditional motherId**: Required only when adding children to assign them to a specific mother
- **Age Validation**: When `motherId` is provided, validates that child is born after mother
- **Branch Assignment**: Automatically assigns children to mother's branch when `motherId` is provided
- **Backward Compatibility**: Existing implementations continue to work without changes

**Example Usage:**
```json
// Adding a father
{
  "firstName": "John",
  "lastName": "Doe",
  "relationship": "Father",
  "birthYear": "1970",
  "isDeceased": false
}

// Adding a mother
{
  "firstName": "Jane",
  "lastName": "Doe",
  "relationship": "Mother",
  "birthYear": "1975",
  "isDeceased": false
}

// Adding a child with mother assignment
{
  "firstName": "Child",
  "lastName": "Doe",
  "relationship": "Child",
  "birthYear": "2000",
  "isDeceased": false,
  "motherId": "mother_member_id_here",
  "parentType": "child"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Family member added successfully",
  "data": {
    "member": {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "name": "string (full name)",
      "relationship": "string",
      "birthYear": "string",
      "isDeceased": "boolean",
      "deathYear": "string",
      "isVerified": "boolean",
      "isFamilyCreator": "boolean",
      "joinId": "string",
      "avatarUrl": "string",
      "parentType": "string",
      "isRootMember": "boolean",
      "motherId": "string (if applicable)",
      "branchId": "string (if applicable)"
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Required fields missing, child must be born after mother, invalid data
- `403 AUTHORIZATION_ERROR`: User can only add members to their own family
- `404 NOT_FOUND`: Family not found, mother not found (when motherId provided)
- `500 INTERNAL_ERROR`: Failed to add family member

**Validation Rules:**
- **Fathers/Mothers**: Automatically marked as root members (`isRootMember: true`)
- **Children with motherId**: 
  - Must be born after mother (age validation)
  - Mother must exist and belong to the family
  - Automatically assigned to mother's branch
- **Children without motherId**: Can be added without mother assignment (for later assignment)
- **All members**: `birthYear` is now required for all member types

---

### 4. Get Family Tree Structure
**Endpoint:** `GET /api/families/:familyId/tree-structure`

**Description:** Get the complete family tree structure with organized branches and member relationships.

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "family": {
      "id": "uuid",
      "name": "string",
      "creationType": "string"
    },
    "treeStructure": {
      "father": {
        "id": "uuid",
        "name": "string",
        "details": "FamilyMember object"
      },
      "mothers": [
        {
          "id": "uuid",
          "name": "string",
          "details": "FamilyMember object",
          "branch": "FamilyBranch object",
          "children": ["Array of FamilyMember objects"]
        }
      ],
      "branches": ["Array of FamilyBranch objects"],
      "statistics": {
        "totalMembers": "number",
        "totalBranches": "number",
        "totalChildren": "number"
      }
    }
  }
}
```

**Error Responses:**
- `403 AUTHORIZATION_ERROR`: User can only view their own family tree structure
- `500 INTERNAL_ERROR`: Failed to get family tree structure

---

### 5. Get Available Mothers for Child
**Endpoint:** `GET /api/families/:familyId/available-mothers`

**Description:** Get a list of available mothers in a family for child assignment.

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "mothers": [
      {
        "id": "uuid",
        "name": "string",
        "spouseOrder": "number",
        "branchName": "string",
        "childrenCount": "number"
      }
    ]
  }
}
```

**Error Responses:**
- `403 AUTHORIZATION_ERROR`: User can only view mothers in their own family
- `500 INTERNAL_ERROR`: Failed to get available mothers

---

## Modified Endpoints

### 1. Link Family (Enhanced)
**Endpoint:** `POST /api/families/link`

**Description:** Link families with enhanced response structure and link type support.

**Request Body:**
```json
{
  "joinId": "string",
  "linkType": "child_family" // New field, defaults to "child_family"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Family linked successfully",
  "data": {
    "linkedFamily": {
      "id": "uuid",
      "name": "string",
      "creatorName": "string",
      "linkedAs": "child_family"
    },
    "mainFamily": {
      "id": "uuid",
      "name": "string"
    },
    "linkedMember": {
      "id": "uuid",
      "name": "string",
      "branch": "string"
    },
    "integrationDetails": {
      "totalLinkedMembers": "number",
      "branchStructure": "string"
    }
  }
}
```

---

### 2. Add Family Member (Enhanced)
**Endpoint:** `POST /api/families/:familyId/members`

**Description:** Enhanced to automatically determine parent type and root member status.

**New Response Fields:**
```json
{
  "success": true,
  "data": {
    "member": {
      // ... existing fields ...
      "parentType": "father" | "mother" | "child",
      "isRootMember": "boolean"
    }
  }
}
```

---

## Database Schema Changes

### New Collections

#### Family_Branches
```javascript
{
  id: "UUID",
  familyId: "UUID (ref: families)",
  motherId: "UUID (ref: family_members)",
  branchName: "string",
  branchOrder: "number",
  description: "string (optional)",
  isActive: "boolean",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

#### Family_Creation_Flow
```javascript
{
  id: "UUID",
  userId: "UUID (ref: users)",
  familyId: "UUID (ref: families)",
  creationType: "own_family" | "parents_family",
  setupCompleted: "boolean",
  currentStep: "initialized" | "parent_setup" | "children_setup" | "completed",
  setupData: {
    parentsSetup: "boolean",
    childrenSetup: "boolean",
    branchesCreated: "boolean"
  },
  metadata: {
    totalSteps: "number",
    completedSteps: "number",
    lastActivity: "timestamp"
  },
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### Modified Collections

#### Families (Enhanced)
```javascript
{
  // ... existing fields ...
  creationType: "own_family" | "parents_family",
  setupCompleted: "boolean",
  currentStep: "initialized" | "parent_setup" | "children_setup" | "completed"
}
```

#### Family_Members (Enhanced)
```javascript
{
  // ... existing fields ...
  motherId: "UUID (ref: family_members, optional)",
  branchId: "UUID (ref: family_branches, optional)",
  isRootMember: "boolean",
  parentType: "father" | "mother" | "child",
  spouseOrder: "number (optional)"
}
```

## Business Logic

### Family Creation Flow
1. **Initialize**: User chooses creation type and family is created
2. **Parent Setup**: Father and mothers are added with branch creation
3. **Children Setup**: Children are added with mother assignments
4. **Completed**: Family setup is complete

### Branch Management
- Each mother gets her own branch
- Branches are ordered left to right
- Children are automatically assigned to their mother's branch
- Branch names are auto-generated (e.g., "First Wife's Branch", "2nd Wife's Branch")

### Age Validation
- Father must be older than all mothers
- Children must be born after their mother
- Reasonable age differences are enforced

### Spouse Order
- Mothers must have sequential spouse orders starting from 1
- First wife is spouse order 1, second wife is 2, etc.
- This determines branch order and positioning

## Error Codes

### New Error Codes
- `INVALID_CREATION_TYPE`: Invalid family creation type
- `PARENT_SETUP_INCOMPLETE`: Parent setup not completed
- `MOTHER_SELECTION_REQUIRED`: Mother ID required for children
- `BRANCH_CREATION_FAILED`: Failed to create family branch
- `INVALID_SPOUSE_ORDER`: Invalid spouse order sequence
- `AGE_VALIDATION_FAILED`: Age relationship validation failed
- `MOTHER_NOT_FOUND`: Mother not found for child assignment
- `BRANCH_NOT_FOUND`: Branch not found for member

## Migration

### Running the Migration
```bash
cd backend
node scripts/migrate-to-new-family-structure.js
```

### Migration Steps
1. Add new fields to existing collections
2. Update parent types for existing members
3. Create branches for existing families with mothers
4. Assign existing children to appropriate branches
5. Update families with new fields
6. Create creation flow records

## Testing

### Test Scenarios
1. **Family Creation Flow**
   - Initialize family creation
   - Setup parents with multiple mothers
   - Add children to specific mothers
   - Verify tree structure

2. **Branch Management**
   - Verify branches are created correctly
   - Test branch ordering
   - Verify children are assigned to correct branches

3. **Age Validation**
   - Test father older than mothers
   - Test children born after mothers
   - Test invalid age relationships

4. **API Responses**
   - Verify all new endpoints return correct data
   - Test error handling
   - Verify validation rules

## Performance Considerations

### Indexing Strategy
- Composite indexes on family_id + branch_id
- Indexes on parent_type and is_root_member
- Branch order indexing for sorting

### Caching Strategy
- Cache family tree structures
- Cache branch information
- Cache creation flow state

## Security

### Authorization
- Users can only access their own families
- Family creators have full access
- Linked members have read-only access

### Validation
- Input sanitization for all fields
- Age relationship validation
- Spouse order validation
- Mother-child relationship validation

## Future Enhancements

### Planned Features
1. **Advanced Branch Management**
   - Custom branch names
   - Branch merging and splitting
   - Branch-level privacy settings

2. **Enhanced Tree Visualization**
   - Interactive tree diagrams
   - Branch-specific styling
   - Zoom and pan capabilities

3. **Family Analytics**
   - Branch statistics
   - Member distribution analysis
   - Growth tracking

4. **Advanced Linking**
   - Multiple link types
   - Link strength indicators
   - Link history tracking

---

## Support

For questions or issues with the new API structure, please refer to:
- API documentation updates
- Migration scripts
- Test cases
- Error code reference

The new structure maintains backward compatibility while providing enhanced functionality for complex family tree management.
