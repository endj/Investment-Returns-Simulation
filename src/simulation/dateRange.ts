export const datesBetween = (startDate: Date, endDate: Date): Array<Date> => {
    if (startDate === endDate) return [startDate];

    const currentDate = new Date(startDate)
    const dates = []
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates;
}