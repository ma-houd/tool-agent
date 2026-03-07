import { z } from "zod";

export const fakeDB_response = z.object({
    type: z.literal("fakeDB"),
    name: z.string(),
    age: z.number().nullable(),
    city: z.string().nullable(),
    found: z.boolean()
});

export const calculator_response = z.object({
    type: z.literal("calculator"),
    result: z.number()
});

export const datetime_response = z.object({
    type: z.literal("datetime"),
    datetime: z.string()
});