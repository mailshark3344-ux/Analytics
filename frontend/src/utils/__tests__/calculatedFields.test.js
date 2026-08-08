import { applyAggregation, aggregationFunctions } from "../aggregationEngine";
import { createCalculatedFieldManager } from "../calculatedFieldManager";

describe("aggregationEngine", () => {
  const rows = [
    { amount: 10, category: "A" },
    { amount: 20, category: "B" },
    { amount: 30, category: "A" }
  ];

  it("applies supported aggregations to a dataset column", () => {
    expect(applyAggregation(rows, "amount", aggregationFunctions.SUM)).toBe(60);
    expect(applyAggregation(rows, "amount", aggregationFunctions.AVERAGE)).toBe(20);
    expect(applyAggregation(rows, "amount", aggregationFunctions.COUNT)).toBe(3);
    expect(applyAggregation(rows, "amount", aggregationFunctions.COUNT_DISTINCT)).toBe(3);
    expect(applyAggregation(rows, "amount", aggregationFunctions.MINIMUM)).toBe(10);
    expect(applyAggregation(rows, "amount", aggregationFunctions.MAXIMUM)).toBe(30);
  });
});

describe("calculatedFieldManager", () => {
  it("stores and removes calculated fields", () => {
    const manager = createCalculatedFieldManager();

    manager.add({
      id: "field-1",
      name: "Total Sales",
      sourceColumn: "amount",
      aggregation: aggregationFunctions.SUM
    });

    expect(manager.getAll()).toHaveLength(1);
    expect(manager.getByName("Total Sales")).toBeDefined();

    manager.remove("field-1");
    expect(manager.getAll()).toHaveLength(0);
  });
});
