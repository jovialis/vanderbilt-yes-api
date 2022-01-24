/**
 * Created by jovialis (Dylan Hanson) on 1/23/22.
 */

export type TermID = string;

export interface Term {
    id: TermID,
    title: string,
    sessions?: TermSession[]
}

export type TermSessionID = string;

export interface TermSession {
    id: TermSessionID,
    titleShort: string,
    titleLong: string
}