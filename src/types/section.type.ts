/**
 * Created by jovialis (Dylan Hanson) on 1/23/22.
 */

import {TermID} from "./term.type.js";

export type SectionID = string;

export interface Course {
    abbreviation: string,
    name: string
}

export interface SectionDetailsCapacity {
    seats: number,
    enrolled: number,
    waitlistSeats: number,
    waitlistEnrolled: number
}

export interface SectionDetails {
    school: string,
    description: string,
    notes: string,
    attributes: string[],
    availability: SectionDetailsCapacity,
    requirements: string,
    bookURL: string
}

export interface Section {
    id: SectionID,
    term: TermID,

    course: Course
    number: string

    instructors: string[],

    type: string,
    schedule: string,
    hours: number

    details?: SectionDetails
}