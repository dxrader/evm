// Multicall контракт для группировки нескольких ERC-20 трансферов в одну транзакцию
// Адреса multicall контрактов в разных сетях
export const MULTICALL_ADDRESSES = {
  polygon: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
  base: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
  arbitrum: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
}

// ABI for aggregate3 method Multicall3
export const MULTICALL3_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'target', type: 'address' },
          { internalType: 'bool', name: 'allowFailure', type: 'bool' },
          { internalType: 'bytes', name: 'callData', type: 'bytes' },
        ],
        internalType: 'struct Multicall3.Call3[]',
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'aggregate3',
    outputs: [
      {
        components: [
          { internalType: 'bool', name: 'success', type: 'bool' },
          { internalType: 'bytes', name: 'returnData', type: 'bytes' },
        ],
        internalType: 'struct Multicall3.Result[]',
        name: 'returnData',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
]

// Creating calldata for ERC-20 transfer
export function createTransferCalldata(to: string, amount: bigint): string {
  const TRANSFER_SIGNATURE = '0xa9059cbb'
  const paddedTo = to.slice(2).toLowerCase().padStart(64, '0')
  const paddedAmount = amount.toString(16).padStart(64, '0')
  return TRANSFER_SIGNATURE + paddedTo + paddedAmount
}

// Creating calldata for multicall aggregate3
export function createMulticallData(calls: { target: string; callData: string }[]): string {
  // Each call consists of: target (address), allowFailure (bool), callData (bytes)
  
  // Function signature for aggregate3(Call3[] calls)
  const AGGREGATE3_SIGNATURE = '0x82ad56cb'
  
  // Start with offset for the array (0x20 = 32 bytes)
  let encoded = '0000000000000000000000000000000000000000000000000000000000000020'
  
  // Array length
  encoded += calls.length.toString(16).padStart(64, '0')
  
  // Offset for each array element (tuple)
  const baseOffset = calls.length * 32 // each element takes 32 bytes for the pointer
  let currentDataOffset = baseOffset
  
  // First, write offsets for each call
  for (let i = 0; i < calls.length; i++) {
    const offset = 32 + baseOffset + currentDataOffset * 32
    encoded += offset.toString(16).padStart(64, '0')
    currentDataOffset += 3 // target(32) + allowFailure(32) + callData offset(32) = 3 slots
  }
  
  // Now, write the data for each call
  for (const call of calls) {
    // target (address)
    encoded += call.target.slice(2).toLowerCase().padStart(64, '0')
    // allowFailure (bool) - always false (0)
    encoded += '0000000000000000000000000000000000000000000000000000000000000000'
    // offset for callData (0x60 = 96 bytes from the start of the tuple)
    encoded += '0000000000000000000000000000000000000000000000000000000000000060'
    // length of callData in bytes
    const calldataLength = (call.callData.slice(2).length / 2).toString(16).padStart(64, '0')
    encoded += calldataLength
    // сам callData
    const paddedCalldata = call.callData.slice(2).padEnd(
      Math.ceil(call.callData.slice(2).length / 64) * 64,
      '0'
    )
    encoded += paddedCalldata
  }
  
  return AGGREGATE3_SIGNATURE + encoded
}

// Simple encoding for aggregate3
export function encodeAggregate3(calls: { target: string; callData: string }[]): string {
  // Using a simplified approach - just encoding the array of calls
  const AGGREGATE3_SIGNATURE = '0x82ad56cb'
  
  // For simplicity, using a fixed format
  // offset of the array
  let data = '0000000000000000000000000000000000000000000000000000000000000020'
  // length of the array
  data += calls.length.toString(16).padStart(64, '0')
  
  // For each call
  let offsetCounter = calls.length * 0x20 // initial offset after the array of pointers
  const encodedCalls: string[] = []
  
  for (const call of calls) {
    // Encoding tuple (target, allowFailure, callData)
    let callEncoded = ''
    // target
    callEncoded += call.target.slice(2).toLowerCase().padStart(64, '0')
    // allowFailure = false
    callEncoded += '0000000000000000000000000000000000000000000000000000000000000000'
    // offset for callData (always 0x60 from the start of this tuple)
    callEncoded += '0000000000000000000000000000000000000000000000000000000000000060'
    // length of callData
    const calldataBytes = call.callData.slice(2).length / 2
    callEncoded += calldataBytes.toString(16).padStart(64, '0')
    // callData itself (padded to 32 bytes)
    const paddedCalldata = call.callData.slice(2).padEnd(
      Math.ceil(call.callData.slice(2).length / 64) * 64,
      '0'
    )
    callEncoded += paddedCalldata
    
    encodedCalls.push(callEncoded)
  }
  
  // Adding offsets for each tuple
  for (let i = 0; i < calls.length; i++) {
    data += offsetCounter.toString(16).padStart(64, '0')
    offsetCounter += encodedCalls[i].length / 2
  }
  
  // Adding the actual data
  for (const encoded of encodedCalls) {
    data += encoded
  }
  
  return AGGREGATE3_SIGNATURE + data
}
