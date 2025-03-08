export class GoogleSheetsUpdateCellError extends Error {
  constructor(
    cell: string,
    value: string | number,
    updatedCellCount: number | null | undefined,
  ) {
    super(
      `could not update cell '${cell}' with value '${value.toString(10)}' (updatedCellCount: ${JSON.stringify(updatedCellCount)})`,
    );
  }
}
