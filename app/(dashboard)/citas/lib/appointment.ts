export function calculateEndAt(
    startAt: Date,
    durationMinutes: number
) {
    return new Date(
        startAt.getTime() + durationMinutes * 60000
    );
}