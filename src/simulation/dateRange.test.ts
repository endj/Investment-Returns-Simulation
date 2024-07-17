import { datesBetween } from "./dateRange";


test('Days between dates', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-10');
    const expectedDates = [
        new Date('2023-01-01'),
        new Date('2023-01-02'),
        new Date('2023-01-03'),
        new Date('2023-01-04'),
        new Date('2023-01-05'),
        new Date('2023-01-06'),
        new Date('2023-01-07'),
        new Date('2023-01-08'),
        new Date('2023-01-09'),
        new Date('2023-01-10')
    ];

    const actualDates = datesBetween(startDate, endDate);
    expect(actualDates).toEqual(expectedDates);
})

test('getDatesBetween handles edge case of same start and end date', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-01');
    const expectedDates = [new Date('2023-01-01')];

    const actualDates = datesBetween(startDate, endDate);

    expect(actualDates).toEqual(expectedDates);
});