import {
	numberOfBitsSet,
	bitwiseOR,
	onlyOption,
	IOnlyOption,
	containingBitIndex,
	highestBitPosition,
	powerOf2BitPositions
} from './bitUtilities';

describe("bitUtilities", () => {
	it("number of bits set", () => {
		expect(numberOfBitsSet(333)).toBe(5);                        		// Population count i.e. 333 = 101001101 i.e. 5 bits set
	});

	describe("Set bits", () => {
		it("should have all bits set", () => {
			const elements: number[] = [1, 2, 4, 8];                    	// 0001 | 0010 | 0100 | 1000 = 1111
			expect(bitwiseOR(elements)).toBe(15);                         // Find bits set within all passed elements
		});

		it("should have duplicate bits set only once", () => {
			const elements: number[] = [1, 2, 3];              						// 01 | 10 | 11  = 11
			expect(bitwiseOR(elements)).toBe(3);
		});

		it("should only have bits set if any item contains that bit", () => {
			const elements: number[] = [2, 6, 12];                        // 0010 | 0110 | 1100 = 1110
			expect(bitwiseOR(elements)).toBe(14);
		});
	});

	describe("Only set option", () => {
		it("should not have any bits set", () => {
			const xorBits: number[] = [1, 2, 3];                   				// 01 ^ 10 ^ 11  = 00 
			expect(onlyOption(xorBits).found).toBe(false);
		});

		it("should have all bits set", () => {
			const xorBits: number[] = [1, 2, 4, 8];                     	// 0001 ^ 0010 ^ 0100 ^ 1000 = 1111
			expect(onlyOption(xorBits).found).toBe(false);                // All bits set i.e. singulare bit required
		});

		it("should have option found at bit 2", () => {
			const xorBits: number[] = [5, 6, 9, 12];                     	// 0101 ^ 0110 ^ 1001 ^ 1100 = 0010
			const options: IOnlyOption = onlyOption(xorBits);
			expect(options.found).toBe(true);
			expect(options.bit).toBe(2);
		});

		it("should not have a singular option set", () => {
			const xorBits: number[] = [3, 6, 12];                      		// 0011 ^ 0110 ^ 1100 = 1001
			const options: IOnlyOption = onlyOption(xorBits);
			expect(options.found).toBe(false);
		});

		it("should only have bit 8 set", () => {
			const xorBits: number[] = [3, 7, 12];                       	// 0011 ^ 0111 ^ 1100 = 1000
			const options: IOnlyOption = onlyOption(xorBits);
			expect(options.found).toBe(true);
			expect(options.bit).toBe(8);
		});
	});

	describe("First index of item in array containing bit", () => {
		let array: number[];

		beforeEach(() => {
				array = [0, 2, 3, 4];                                 			// 000, 010, 011, 100
		});

		it("should have bit 1 set i.e. index 2", () => {
				expect(containingBitIndex(array, 1)).toBe(2);            		// Index of first item that has bit 1 set i.e. 2
		});

		it("should have bit 2 set i.e. index 2", () => {
				expect(containingBitIndex(array, 2)).toBe(1);              	// Index of first item that has bit 2 set i.e. 2
		});

		it("should have bit 4 set i.e. index 3", () => {
				expect(containingBitIndex(array, 4)).toBe(3);              	// Index of first item that has bit 4 set i.e. 3
		});

		it("should have index out of range", () => {
				expect(containingBitIndex(array, 8)).toBe(array.length);  	// Bit 8 not set => index out of range
		});

		it("should not have bit 0 found (out of range)", () => {
				expect(containingBitIndex(array, 0)).toBe(array.length);   	// Bit 0 not found => index out of range
		});
	});

	describe("Highest bit position", () => {
		it("should not exist", () => {
			expect(highestBitPosition(0)).toBe(0);
		});

		it("should be 0 in 1", () => {
			expect(highestBitPosition(1)).toBe(0);
		});

		it("should be 1 in 10", () => {
			expect(highestBitPosition(2)).toBe(1);
		});

		it("should be 1 in 11", () => {
			expect(highestBitPosition(3)).toBe(1);
		});

		it("should be 2 in 100", () => {
			expect(highestBitPosition(4)).toBe(2);
		});

		it("should be 2 in 101", () => {
			expect(highestBitPosition(5)).toBe(2);
		});

		it("should be 2 in 110", () => {
			expect(highestBitPosition(6)).toBe(2);
		});

		it("should be 2 in 111", () => {
			expect(highestBitPosition(7)).toBe(2);
		});

		it("should be 3 in 1000", () => {
			expect(highestBitPosition(8)).toBe(3);
		});

		it("should be 3 in 1001", () => {
			expect(highestBitPosition(9)).toBe(3);
		});

		it("should be 4 in 10000", () => {
			expect(highestBitPosition(16)).toBe(4);
		});

		it("should be 4 in 10001", () => {
			expect(highestBitPosition(17)).toBe(4);
		});

		it("should be 4 in 10010", () => {
			expect(highestBitPosition(18)).toBe(4);
		});

		it("should match highestBitPosition function", () => {
			const localHighestBitPosition = (value: number): number => {
				let index = 0;
				let bit = 1;
				while (bit <= value) {
					bit <<= 1;
					index++;
				}
	
				return index - 1;
			};

			for (let index = 1; index < 32; index++)
				expect(highestBitPosition(index)).toBe(localHighestBitPosition(index));
		});
	});

	describe("Power of 2 bit position", () => {
		it("should match", () => {
			expect(powerOf2BitPositions[1]).toBe(0);
			expect(powerOf2BitPositions[2]).toBe(1);
			expect(powerOf2BitPositions[4]).toBe(2);
			expect(powerOf2BitPositions[8]).toBe(3);
			expect(powerOf2BitPositions[16]).toBe(4);
			expect(powerOf2BitPositions[32]).toBe(5);
			expect(powerOf2BitPositions[64]).toBe(6);
			expect(powerOf2BitPositions[128]).toBe(7);
			expect(powerOf2BitPositions[256]).toBe(8);
			expect(powerOf2BitPositions[512]).toBe(9);
			expect(powerOf2BitPositions[1024]).toBe(10);

			for (let index = 0; index < 31; index++)
				expect(powerOf2BitPositions[1 << index]).toBe(index);

			expect(powerOf2BitPositions[2147483648]).toBe(31);
		});
	});
});
