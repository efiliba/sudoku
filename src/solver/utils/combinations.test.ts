import { Combinations } from "./combinations";

describe("combinations", () => {
	let combinations;//: ICombinations<string>;
	let from: string[];

	beforeEach(() => {
		combinations = new Combinations(9);                            	// Columns * rows
		from = ["a", "b", "c", "d"];
	});

	it("C(4, 1) = 4", () => {
		const pick = 1;
		const items: string[][] = combinations.select(from, pick);

		const expected: string[][] = [];
		expected[0] = ["a"];
		expected[1] = ["b"];
		expected[2] = ["c"];
		expected[3] = ["d"];

		expect(items).toEqual(expected);
	});

	// C(4, 2) = 4 * 3 / 2 = 6
	it("C(4, 2) = 6", () => {
		const pick = 2;
		const items: string[][] = combinations.select(from, pick);

		const expected: string[][] = [];
		expected[0] = ["a", "b"];
		expected[1] = ["a", "c"];
		expected[2] = ["b", "c"];
		expected[3] = ["a", "d"];
		expected[4] = ["b", "d"];
		expected[5] = ["c", "d"];

		expect(items).toEqual(expected);
	});

	it("C(4, 3) = 4", () => {
		const pick = 3;
		const items: string[][] = combinations.select(from, pick);

		const expected: string[][] = [];
		expected[0] = ["a", "b", "c"];
		expected[1] = ["a", "b", "d"];
		expected[2] = ["a", "c", "d"];
		expected[3] = ["b", "c", "d"];

		expect(items).toEqual(expected);
	});

	it("C(4, 4) = 1", () => {
		const pick = 4;
		const items: string[][] = combinations.select(from, pick);

		const expected: string[][] = [];
		expected[0] = ["a", "b", "c", "d"];

		expect(items).toEqual(expected);
	});
});