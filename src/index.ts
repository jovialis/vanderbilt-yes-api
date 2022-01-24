/**
 * Created by jovialis (Dylan Hanson) on 1/23/22.
 */

import {SubjectScraper} from "./scrapers/subject.scraper.js";
import {StreamedResponseHandler} from "./scrapers/utils/scraper.js";
import {Subject} from "./types/subject.type.js";
import {Term} from "./types/term.type.js";
import {TermScraper} from "./scrapers/term.scraper.js";
import {Section, SectionDetails} from "./types/section.type.js";
import {SectionTermScraper} from "./scrapers/section.term.scraper.js";
import {SectionQueryScraper} from "./scrapers/section.query.scraper.js";
import {SectionDetailScraper} from "./scrapers/sectionDetail.scraper.js";

/**
 * Fetches all Subjects available on YES
 * @param handler Streamed Response Handler to incrementally process discovered Subjects
 */
export async function getSubjects(handler?: StreamedResponseHandler<Subject>): Promise<Subject[]> {
    const scraper = new SubjectScraper();
    return await scraper.scrape(handler);
}

/**
 * Fetches all Terms available on YES
 @param handler Streamed Response Handler to incrementally process discovered Terms
 */
export async function getTerms(handler?: StreamedResponseHandler<Term>): Promise<Term[]> {
    const scraper = new TermScraper();
    return await scraper.scrape(handler)
}

/**
 * Fetches all Sections for a given Term
 * @param term A Term object to search for Sections within
 * @param detailed Whether to populate detailed information for each discovered Section
 * @param handler Streamed Response Handler to incrementally process discovered Sections
 */
export async function getAllSections(term: Term, detailed: boolean, handler?: StreamedResponseHandler<Section>): Promise<Section[]> {
    const scraper = new SectionTermScraper(term.id, detailed);
    return await scraper.scrape(handler);
}

/**
 * Fetches all Sections by a search query.
 * @param query Query to search by
 * @param term A Term object to search for Sections within
 * @param detailed Whether to populate detailed information for each discovered Section
 * @param handler Streamed Response Handler to incrementally process discovered Sections
 */
export async function searchSections(query: string, term: Term, detailed: boolean, handler?: StreamedResponseHandler<Section>): Promise<Section[]> {
    const scraper = new SectionQueryScraper(query, term.id, detailed);
    return await scraper.scrape(handler);
}

/**
 * Fetches detailed information for a Section
 * @param section Section to fetch details for
 * @param handler Streamed Response Handler to incrementally process discovered Sections
 */
export async function getSectionDetails(section: Section, handler?: StreamedResponseHandler<SectionDetails>): Promise<SectionDetails> {
    const scraper = new SectionDetailScraper(section);
    return (await scraper.scrape(handler))[0];
}