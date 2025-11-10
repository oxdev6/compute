#!/usr/bin/env node

/**
 * ENS Compute CLI
 * Command-line interface for interacting with ENS Compute endpoints
 */

const { Command } = require('commander');
const { ethers } = require('ethers');
const axios = require('axios');
const readline = require('readline');

const program = new Command();

program
  .name('enscompute')
  .description('CLI for ENS Compute - Verifiable computation endpoints')
  .version('1.0.0');

// Call command
program
  .command('call <name> <method>')
  .description('Call a compute endpoint')
  .option('-p, --params <params>', 'JSON parameters', '{}')
  .option('-r, --rpc <url>', 'RPC URL', 'http://localhost:8545')
  .option('-g, --gateway <url>', 'Gateway URL', 'http://localhost:3000')
  .option('-c, --cursor <cursor>', 'Pagination cursor')
  .option('--direct', 'Use direct gateway call (bypass CCIP-Read)')
  .action(async (name, method, options) => {
    try {
      const params = JSON.parse(options.params);
      if (options.cursor) {
        params.cursor = options.cursor;
      }

      if (options.direct) {
        // Direct gateway call
        const response = await axios.post(`${options.gateway}/compute`, {
          function: method,
          params: params,
        });

        console.log('\n✅ Result:');
        console.log(JSON.stringify(response.data.result, null, 2));
        console.log('\n📝 Signature:', response.data.signature);
        console.log('🔑 Signer:', response.data.signer);
      } else {
        // Full CCIP-Read resolution
        console.log(`Resolving ${name} → ${method}...`);
        console.log('(CCIP-Read flow - requires deployed contracts)');
        // Implementation would use SDK here
        console.log('Use --direct flag for testing without contracts');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// List functions
program
  .command('functions')
  .description('List available compute functions')
  .option('-g, --gateway <url>', 'Gateway URL', 'http://localhost:3000')
  .action(async (options) => {
    try {
      const response = await axios.get(`${options.gateway}/functions`);
      console.log('\n📋 Available Functions:');
      response.data.functions.forEach(fn => {
        console.log(`  • ${fn}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Tail command (stream logs)
program
  .command('tail <name>')
  .description('Stream endpoint results (live logs)')
  .option('-g, --gateway <url>', 'Gateway URL', 'http://localhost:3000')
  .option('-f, --follow', 'Follow mode (continuous)')
  .action(async (name, options) => {
    console.log(`📡 Streaming ${name}...`);
    console.log('(Press Ctrl+C to stop)\n');
    
    // Poll for updates
    const poll = async () => {
      try {
        const response = await axios.get(`${options.gateway}/health`);
        console.log(`[${new Date().toISOString()}] Gateway: ${response.data.status}`);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    await poll();
    if (options.follow) {
      setInterval(poll, 5000);
    }
  });

// Author command
program
  .command('author')
  .description('Author console commands')
  .addCommand(
    new Command('create')
      .description('Create a new compute endpoint')
      .option('-n, --name <name>', 'ENS name')
      .option('-s, --script <file>', 'Compute script file')
      .action(async (options) => {
        console.log('📝 Creating endpoint...');
        console.log('Name:', options.name);
        console.log('Script:', options.script);
        console.log('\nUse the web UI at /author for full authoring experience');
      })
  );

// Parse arguments
program.parse();

