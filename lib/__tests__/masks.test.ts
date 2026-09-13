import { maskCep, maskPhone } from "../masks";

describe("maskCep", () => {
  it("formats 8 digits as 00000-000", () => {
    expect(maskCep("13010000")).toBe("13010-000");
  });

  it("formats partial input progressively", () => {
    expect(maskCep("13010")).toBe("13010");
    expect(maskCep("130100")).toBe("13010-0");
  });

  it("strips non-digits and caps at 8", () => {
    expect(maskCep("13a010-00099")).toBe("13010-000");
  });

  it("handles empty input", () => {
    expect(maskCep("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("formats 11 digits as (00) 00000-0000", () => {
    expect(maskCep("")).toBe("");
    expect(maskPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("formats 10 digits as (00) 0000-0000", () => {
    expect(maskPhone("1932514455")).toBe("(19) 3251-4455");
  });

  it("formats partial input progressively", () => {
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("1199999")).toBe("(11) 9999-9");
  });

  it("strips non-digits and caps at 11", () => {
    expect(maskPhone("(11) 99999-888899")).toBe("(11) 99999-8888");
  });

  it("handles empty input", () => {
    expect(maskPhone("")).toBe("");
  });
});
