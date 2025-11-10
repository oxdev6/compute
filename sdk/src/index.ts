/**
 * ENS Compute SDK
 * TypeScript SDK for resolving ENS names to verifiable computation results
 */

import { ethers } from 'ethers';
import axios, { AxiosInstance } from 'axios';

export interface Envelope {
  name: string;
  method: string;
  params: string;
  result: string;
  cursor: string | null;
  prev_digest: string | null;
  meta: string;
  cache_ttl: number;
  digest: string;
  signature: string;
}

export interface ComputeResult<T = any> {
  success: boolean;
  data: T;
  type: string;
}

export interface PaginatedResult<T = any> extends ComputeResult<T> {
  items?: T[];
  cursor?: string | null;
  hasNext: () => boolean;
  next: () => Promise<PaginatedResult<T>>;
}

export interface ResolveOptions {
  useEnvelope?: boolean;
  cacheTtl?: number;
  pageSize?: number;
  cursor?: string | null;
}

export class ENSCompute {
  private provider: ethers.Provider;
  private resolverAddress: string;
  private gatewayClient: AxiosInstance;
  private useEnvelope: boolean;

  constructor(
    provider: ethers.Provider | string,
    resolverAddress: string,
    gatewayURL?: string,
    options: { useEnvelope?: boolean } = {}
  ) {
    this.provider = typeof provider === 'string' 
      ? new ethers.JsonRpcProvider(provider)
      : provider;
    this.resolverAddress = resolverAddress;
    this.useEnvelope = options.useEnvelope ?? true;
    
    const gateway = gatewayURL || 'http://localhost:3000';
    this.gatewayClient = axios.create({
      baseURL: gateway,
      timeout: 30000,
    });
  }

  /**
   * Resolves an ENS name to a computation result
   * @param name ENS name (e.g., "pricefeed.eth")
   * @param method Compute method name
   * @param params Method parameters
   * @param options Resolution options
   * @returns Computation result
   */
  async resolve<T = any>(
    name: string,
    method: string,
    params: any = {},
    options: ResolveOptions = {}
  ): Promise<PaginatedResult<T>> {
    const node = ethers.namehash(name);
    const useEnvelope = options.useEnvelope ?? this.useEnvelope;

    // Prepare call data
    const callData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'bytes'],
      [method, ethers.toUtf8Bytes(JSON.stringify({ ...params, ...options }))]
    );

    try {
      // Try direct resolution (will trigger CCIP-Read if needed)
      const resolver = new ethers.Contract(
        this.resolverAddress,
        [
          'function resolve(bytes32 node, bytes calldata data) external view returns (bytes memory)',
          'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
        ],
        this.provider
      );

      try {
        const result = await resolver.resolve(node, callData);
        return this.parseResult<T>(ethers.toUtf8String(result), method);
      } catch (error: any) {
        // Check if it's an OffchainLookup error
        if (error.data && error.data.selector === '0x556f1830') {
          return await this.handleOffchainLookup(error, node, method, params, options);
        }
        throw error;
      }
    } catch (error: any) {
      throw new Error(`Resolution failed: ${error.message}`);
    }
  }

  /**
   * Handles CCIP-Read off-chain lookup
   */
  private async handleOffchainLookup<T>(
    error: any,
    node: string,
    method: string,
    params: any,
    options: ResolveOptions
  ): Promise<PaginatedResult<T>> {
    // Parse OffchainLookup error
    const [sender, urls, callData, callbackFunction, extraData] = 
      ethers.AbiCoder.defaultAbiCoder().decode(
        ['address', 'string[]', 'bytes', 'bytes4', 'bytes'],
        error.data.slice(10)
      );

    // Fetch from gateway
    const gatewayURL = urls[0];
    const response = await this.gatewayClient.post('/lookup', {
      node: node,
      data: callData,
      name: params.name || 'unknown.eth',
      useEnvelope: options.useEnvelope ?? this.useEnvelope,
    });

    // Call resolveWithProof
    const resolver = new ethers.Contract(
      this.resolverAddress,
      [
        'function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory)',
      ],
      this.provider
    );

    const verifiedResult = await resolver.resolveWithProof(
      response.data.data,
      extraData
    );

    return this.parseResult<T>(ethers.toUtf8String(verifiedResult), method);
  }

  /**
   * Parses result and creates paginated result object
   */
  private parseResult<T>(resultString: string, method: string): PaginatedResult<T> {
    const result: ComputeResult<T> = JSON.parse(resultString);
    
    // Check if it's a paginated result
    const items = (result.data as any)?.items || (Array.isArray(result.data) ? result.data : [result.data]);
    const cursor = (result.data as any)?.cursor || null;

    const paginated: PaginatedResult<T> = {
      ...result,
      items: items.length > 0 ? items : [result.data],
      cursor,
      hasNext: () => cursor !== null && cursor !== undefined,
      next: async () => {
        if (!cursor) {
          throw new Error('No next page available');
        }
        // This would need the original name and method - simplified for now
        throw new Error('next() requires original resolve call - use resolve() with cursor parameter');
      },
    };

    return paginated;
  }

  /**
   * Direct gateway call (bypasses CCIP-Read, for testing)
   */
  async directCompute<T = any>(
    method: string,
    params: any = {},
    options: ResolveOptions = {}
  ): Promise<{ result: ComputeResult<T>; envelope?: Envelope; signature: string; signer: string }> {
    const response = await this.gatewayClient.post('/compute', {
      function: method,
      params: { ...params, ...options },
    });

    return response.data;
  }

  /**
   * Lists available compute functions
   */
  async listFunctions(): Promise<string[]> {
    const response = await this.gatewayClient.get('/functions');
    return response.data.functions;
  }

  /**
   * Health check
   */
  async health(): Promise<any> {
    const response = await this.gatewayClient.get('/health');
    return response.data;
  }
}

// Export convenience function
export function createENSCompute(
  provider: ethers.Provider | string,
  resolverAddress: string,
  gatewayURL?: string
): ENSCompute {
  return new ENSCompute(provider, resolverAddress, gatewayURL);
}

