import { describe, it, expect, beforeEach } from 'vitest';
import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'clarinet';

describe('Research Crowdsourcing Platform Contract Tests', () => {
  // Test setup
  let chain: Chain;
  let accounts: Map<string, Account>;
  let deployer: Account;
  let researcher1: Account;
  let researcher2: Account;
  
  beforeEach(() => {
    // Setup a new chain and accounts for each test
    const clarinet = new Clarinet();
    chain = clarinet.chain;
    accounts = clarinet.accounts;
    
    deployer = accounts.get('deployer')!;
    researcher1 = accounts.get('wallet_1')!;
    researcher2 = accounts.get('wallet_2')!;
  });
  
  // Project Creation Tests
  describe('Project Creation', () => {
    it('should allow creating a new research project', () => {
      const projectName = 'AI Ethics Research';
      const projectDescription = 'Exploring ethical implications of AI technologies';
      const initialFunding = 1000;
      const contributionThreshold = 50;
      
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8(projectName),
              types.utf8(projectDescription),
              types.uint(initialFunding),
              types.uint(contributionThreshold)
            ],
            researcher1.address
        )
      ]);
      
      // Assert transaction success
      expect(block.receipts[0].result).to.match(/^(ok \d+)$/);
      
      // Verify project details
      const projectDetails = chain.callReadOnly(
          'research-crowdsourcing',
          'get-project-details',
          [types.uint(1)]
      );
      
      const expectedProjectDetails = {
        'name': projectName,
        'description': projectDescription,
        'owner': researcher1.address,
        'total-funding': initialFunding,
        'current-phase': 1,
        'is-active': true,
        'contribution-threshold': contributionThreshold
      };
      
      expect(projectDetails.result).to.deep.equal(expectedProjectDetails);
    });
    
    it('should prevent creating project with zero initial funding', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8('Invalid Project'),
              types.utf8('Project with no funding'),
              types.uint(0),
              types.uint(50)
            ],
            researcher1.address
        )
      ]);
      
      // Assert transaction failure due to insufficient funds
      expect(block.receipts[0].result).to.match(/^(err u101)$/);
    });
  });
  
  // Contribution Tests
  describe('Project Contributions', () => {
    beforeEach(() => {
      // Setup a project before each contribution test
      chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8('Machine Learning Research'),
              types.utf8('Advanced ML algorithms'),
              types.uint(5000),
              types.uint(100)
            ],
            researcher1.address
        )
      ]);
    });
    
    it('should allow valid contributions to a project', () => {
      const contributionDescription = 'Novel gradient descent optimization';
      const contributionValue = 200;
      
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'contribute-to-project',
            [
              types.uint(1),
              types.utf8(contributionDescription),
              types.uint(contributionValue)
            ],
            researcher2.address
        )
      ]);
      
      // Assert contribution success
      expect(block.receipts[0].result).to.match(/^(ok \d+)$/);
      
      // Verify contributor data
      const contributorData = chain.callReadOnly(
          'research-crowdsourcing',
          'get-contributor-data',
          [types.uint(1), types.principal(researcher2.address)]
      );
      
      expect(contributorData.result).to.deep.include({
        'total-contributions': contributionValue,
        'contribution-phases': [1]
      });
    });
    
    it('should prevent contributions below threshold', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'contribute-to-project',
            [
              types.uint(1),
              types.utf8('Low-value contribution'),
              types.uint(50)  // Below 100 threshold
            ],
            researcher2.address
        )
      ]);
      
      // Assert contribution failure
      expect(block.receipts[0].result).to.match(/^(err u103)$/);
    });
  });
  
  // Project Phase Management Tests
  describe('Project Phase Management', () => {
    beforeEach(() => {
      // Setup a project before phase management tests
      chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8('Blockchain Research'),
              types.utf8('Exploring consensus mechanisms'),
              types.uint(10000),
              types.uint(200)
            ],
            researcher1.address
        )
      ]);
    });
    
    it('should allow project owner to advance project phase', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'advance-project-phase',
            [types.uint(1)],
            researcher1.address
        )
      ]);
      
      // Assert phase advancement success
      expect(block.receipts[0].result).to.equal('(ok true)');
      
      // Verify project details
      const projectDetails = chain.callReadOnly(
          'research-crowdsourcing',
          'get-project-details',
          [types.uint(1)]
      );
      
      expect(projectDetails.result).to.deep.include({
        'current-phase': 2
      });
    });
    
    it('should prevent non-owners from advancing project phase', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'advance-project-phase',
            [types.uint(1)],
            researcher2.address
        )
      ]);
      
      // Assert unauthorized phase advancement
      expect(block.receipts[0].result).to.match(/^(err u100)$/);
    });
  });
  
  // Project Closure Tests
  describe('Project Closure', () => {
    beforeEach(() => {
      // Setup a project before closure tests
      chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8('Climate Change Research'),
              types.utf8('Sustainable technology solutions'),
              types.uint(15000),
              types.uint(250)
            ],
            researcher1.address
        )
      ]);
    });
    
    it('should allow project owner to close the project', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'close-project',
            [types.uint(1)],
            researcher1.address
        )
      ]);
      
      // Assert project closure success
      expect(block.receipts[0].result).to.equal('(ok true)');
      
      // Verify project is inactive
      const projectDetails = chain.callReadOnly(
          'research-crowdsourcing',
          'get-project-details',
          [types.uint(1)]
      );
      
      expect(projectDetails.result).to.deep.include({
        'is-active': false
      });
    });
    
    it('should prevent non-owners from closing the project', () => {
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'close-project',
            [types.uint(1)],
            researcher2.address
        )
      ]);
      
      // Assert unauthorized project closure
      expect(block.receipts[0].result).to.match(/^(err u100)$/);
    });
  });
  
  // Edge Case and Error Handling Tests
  describe('Error Handling', () => {
    it('should handle non-existent project queries', () => {
      const projectDetails = chain.callReadOnly(
          'research-crowdsourcing',
          'get-project-details',
          [types.uint(999)]  // Non-existent project ID
      );
      
      expect(projectDetails.result).to.equal('none');
    });
    
    it('should prevent contributions to closed projects', () => {
      // Create and then close a project
      chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'create-project',
            [
              types.utf8('Closed Research Project'),
              types.utf8('Test project closure'),
              types.uint(5000),
              types.uint(100)
            ],
            researcher1.address
        ),
        Tx.contractCall(
            'research-crowdsourcing',
            'close-project',
            [types.uint(2)],
            researcher1.address
        )
      ]);
      
      // Attempt to contribute to closed project
      const block = chain.mineBlock([
        Tx.contractCall(
            'research-crowdsourcing',
            'contribute-to-project',
            [
              types.uint(2),
              types.utf8('Attempt to contribute to closed project'),
              types.uint(200)
            ],
            researcher2.address
        )
      ]);
      
      // Assert contribution to closed project fails
      expect(block.receipts[0].result).to.match(/^(err u104)$/);
    });
  });
});

