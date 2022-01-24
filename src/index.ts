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

export async function getSubjects(handler?: StreamedResponseHandler<Subject>): Promise<Subject[]> {
    const scraper = new SubjectScraper();
    return await scraper.scrape(handler);
}

export async function getTerms(handler?: StreamedResponseHandler<Term>): Promise<Term[]> {
    const scraper = new TermScraper();
    return await scraper.scrape(handler)
}

export async function getAllSections(term: Term, detailed: boolean, handler?: StreamedResponseHandler<Section>): Promise<Section[]> {
    const scraper = new SectionTermScraper(term.id, detailed);
    return await scraper.scrape(handler);
}

export async function searchSections(query: string, term: Term, detailed: boolean, handler?: StreamedResponseHandler<Section>): Promise<Section[]> {
    const scraper = new SectionQueryScraper(query, term.id, detailed);
    return await scraper.scrape(handler);
}

export async function getSectionDetails(section: Section, handler?: StreamedResponseHandler<SectionDetails>): Promise<SectionDetails> {
    const scraper = new SectionDetailScraper(section);
    return (await scraper.scrape(handler))[0];
}