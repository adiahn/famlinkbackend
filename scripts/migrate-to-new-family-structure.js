const mongoose = require('mongoose');
const Family = require('../src/models/Family');
const FamilyMember = require('../src/models/FamilyMember');
const FamilyBranch = require('../src/models/FamilyBranch');
const FamilyCreationFlow = require('../src/models/FamilyCreationFlow');
require('dotenv').config();

const logger = console.log;

async function migrateDatabase() {
  try {
    logger('🚀 Starting database migration to new family structure...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    logger('✅ Connected to database');
    
    // Step 1: Create new tables (they should already exist from model definitions)
    logger('📋 Step 1: Verifying new models exist...');
    
    // Step 2: Add new columns to existing family_members collection
    logger('📋 Step 2: Adding new columns to family_members...');
    
    const updateResult = await mongoose.connection.db.collection('familymembers').updateMany(
      {},
      {
        $set: {
          parentType: 'child', // Default to child for existing members
          isRootMember: false, // Default to false for existing members
          spouseOrder: null, // No spouse order for existing members
          motherId: null, // No mother ID for existing members
          branchId: null // No branch ID for existing members
        }
      }
    );
    
    logger(`✅ Updated ${updateResult.modifiedCount} family members with new fields`);
    
    // Step 3: Update existing family members to have correct parentType
    logger('📋 Step 3: Updating parent types for existing members...');
    
    const fatherUpdateResult = await mongoose.connection.db.collection('familymembers').updateMany(
      { relationship: { $regex: /father/i } },
      {
        $set: {
          parentType: 'father',
          isRootMember: true
        }
      }
    );
    
    const motherUpdateResult = await mongoose.connection.db.collection('familymembers').updateMany(
      { relationship: { $regex: /mother|wife/i } },
      {
        $set: {
          parentType: 'mother',
          isRootMember: true
        }
      }
    );
    
    logger(`✅ Updated ${fatherUpdateResult.modifiedCount} fathers`);
    logger(`✅ Updated ${motherUpdateResult.modifiedCount} mothers`);
    
    // Step 4: Create branches for existing families with mothers
    logger('📋 Step 4: Creating branches for existing families...');
    
    const familiesWithMothers = await FamilyMember.aggregate([
      {
        $match: { parentType: 'mother' }
      },
      {
        $group: {
          _id: '$familyId',
          mothers: { $push: '$$ROOT' }
        }
      }
    ]);
    
    let branchesCreated = 0;
    for (const familyGroup of familiesWithMothers) {
      const familyId = familyGroup._id;
      const mothers = familyGroup.mothers.sort((a, b) => {
        // Try to determine spouse order from relationship or position
        const aOrder = a.relationship.match(/\d+/) ? parseInt(a.relationship.match(/\d+/)[0]) : 1;
        const bOrder = b.relationship.match(/\d+/) ? parseInt(b.relationship.match(/\d+/)[0]) : 1;
        return aOrder - bOrder;
      });
      
      for (let i = 0; i < mothers.length; i++) {
        const mother = mothers[i];
        const spouseOrder = i + 1;
        
        // Create branch
        const branch = await FamilyBranch.create({
          familyId,
          motherId: mother._id,
          branchName: spouseOrder === 1 ? 'First Wife\'s Branch' : `${spouseOrder}${getOrdinalSuffix(spouseOrder)} Wife's Branch`,
          branchOrder: spouseOrder
        });
        
        // Update mother with branch ID and spouse order
        await FamilyMember.findByIdAndUpdate(mother._id, {
          branchId: branch._id,
          spouseOrder
        });
        
        branchesCreated++;
      }
    }
    
    logger(`✅ Created ${branchesCreated} branches for existing families`);
    
    // Step 5: Update existing children to be assigned to appropriate branches
    logger('📋 Step 5: Assigning existing children to branches...');
    
    const childrenToUpdate = await FamilyMember.find({
      parentType: 'child',
      familyId: { $exists: true }
    });
    
    let childrenUpdated = 0;
    for (const child of childrenToUpdate) {
      // Find a mother in the same family (for now, assign to first available branch)
      const branch = await FamilyBranch.findOne({ familyId: child.familyId }).sort({ branchOrder: 1 });
      
      if (branch) {
        await FamilyMember.findByIdAndUpdate(child._id, {
          branchId: branch._id,
          motherId: branch.motherId
        });
        childrenUpdated++;
      }
    }
    
    logger(`✅ Updated ${childrenUpdated} children with branch assignments`);
    
    // Step 6: Update existing families with new fields
    logger('📋 Step 6: Updating existing families with new fields...');
    
    const familyUpdateResult = await mongoose.connection.db.collection('families').updateMany(
      {},
      {
        $set: {
          creationType: 'own_family', // Default to own_family for existing families
          setupCompleted: true, // Mark existing families as completed
          currentStep: 'completed' // Mark existing families as completed
        }
      }
    );
    
    logger(`✅ Updated ${familyUpdateResult.modifiedCount} families with new fields`);
    
    // Step 7: Create creation flow records for existing families
    logger('📋 Step 7: Creating creation flow records for existing families...');
    
    const existingFamilies = await Family.find({});
    let flowsCreated = 0;
    
    for (const family of existingFamilies) {
      // Check if creation flow already exists
      const existingFlow = await FamilyCreationFlow.findOne({ familyId: family._id });
      
      if (!existingFlow) {
        await FamilyCreationFlow.create({
          userId: family.creatorId,
          familyId: family._id,
          creationType: family.creationType || 'own_family',
          setupCompleted: true,
          currentStep: 'completed',
          setupData: {
            parentsSetup: true,
            childrenSetup: true,
            branchesCreated: true
          }
        });
        flowsCreated++;
      }
    }
    
    logger(`✅ Created ${flowsCreated} creation flow records`);
    
    logger('🎉 Database migration completed successfully!');
    
  } catch (error) {
    logger('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger('🔌 Disconnected from database');
  }
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      logger('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
