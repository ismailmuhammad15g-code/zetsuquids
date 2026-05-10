"use client";
import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

/**
 * Runs on app startup and silently purges from localStorage:
 *  - guides that were REJECTED in Supabase
 *  - guides that no longer EXIST in Supabase at all (orphaned)
 *  - guides with no slug (malformed entries)
 * Completely invisible to the user — no UI, no alerts.
 */
export function useLocalStoragePurge() {
    useEffect(() => {
        const run = async () => {
            try {
                if (!isSupabaseConfigured()) return;

                const raw = localStorage.getItem("guides");
                if (!raw) return;

                const localGuides: Array<{ slug?: string; status?: string }> = JSON.parse(raw);
                if (!localGuides || localGuides.length === 0) return;

                // Collect ALL slugs that have a value — including pending, approved, unknown status
                const slugs = localGuides
                    .map(g => g.slug)
                    .filter((s): s is string => typeof s === "string" && s.trim().length > 0);

                if (slugs.length === 0) {
                    // No valid slugs at all — wipe the broken entries
                    const malformedCount = localGuides.filter(g => !g.slug).length;
                    if (malformedCount > 0) {
                        localStorage.setItem("guides", JSON.stringify([]));
                        console.log(`[LocalStoragePurge] Removed ${malformedCount} malformed guide(s) with no slug.`);
                    }
                    return;
                }

                // Ask Supabase: which of these slugs still exist AND are approved/pending?
                const { data, error } = await supabase
                    .from("guides")
                    .select("slug, status")
                    .in("slug", slugs);

                if (error || !data) return;

                // Only keep slugs that exist in DB and are NOT rejected
                const validSlugs = new Set(
                    (data as { slug: string; status: string }[])
                        .filter(g => g.status !== "rejected")
                        .map(g => g.slug)
                );

                const before = localGuides.length;
                const cleaned = localGuides.filter(g => {
                    if (!g.slug || g.slug.trim().length === 0) return false; // remove malformed
                    return validSlugs.has(g.slug); // remove orphaned/rejected
                });

                if (cleaned.length !== before) {
                    localStorage.setItem("guides", JSON.stringify(cleaned));
                    console.log(
                        `[LocalStoragePurge] Purged ${before - cleaned.length} orphaned/rejected guide(s) from localStorage.`
                    );
                }
            } catch (e) {
                // Silent fail — this is non-critical housekeeping
                console.warn("[LocalStoragePurge] Failed silently:", e);
            }
        };

        // Run immediately — no delay needed since this is background work
        run();
    }, []);
}
