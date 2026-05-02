#!/usr/bin/env python3
"""
🔥 SIMPLE DATABASE RESET SCRIPT 🔥
===================================
A lightweight version for clearing Supabase database.

Usage:
    python3 scripts/reset_simple.py
    python3 scripts/reset_simple.py --force
"""

import os
import sys
import json
from typing import Optional
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Supabase imports - try different methods
supabase_client = None
try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("❌ Required: pip install supabase python-dotenv")
    sys.exit(1)

# ============================================================================
# CONFIG
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

TABLES = [
    "community_poll_votes", "community_poll_options", "community_polls",
    "community_post_hashtags", "community_follows", "community_notifications",
    "post_bookmarks", "post_likes", "post_comments", "posts",
    "community_members", "community_conversations", "community_messages",
    "community_groups", "guide_versions", "guide_inline_comments",
    "guide_ratings", "guide_comments", "guide_time_logs", "guide_views",
    "user_guide_interactions", "user_follows", "claimed_rewards",
    "user_chatbot_usage", "zetsuguide_conversations", "zetsuguide_usage_logs",
    "support_messages", "support_conversations", "bug_reports",
    "ui_component_likes", "ui_components", "usage_logs",
    "zetsuguide_referrals", "zetsuguide_credits", "zetsuguide_user_profiles",
    "zetsuguide_ads", "community_hashtags", "guides"
]

# ============================================================================
# VALIDATION
# ============================================================================

def validate():
    """Validate configuration."""
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL not found")
        print("   Add to .env: SUPABASE_URL=https://...")
        sys.exit(1)
    
    if not SUPABASE_KEY:
        print("❌ Error: SUPABASE_SERVICE_KEY not found")
        print("   Add to .env: SUPABASE_SERVICE_KEY=...")
        sys.exit(1)
    
    if "supabase.co" not in SUPABASE_URL:
        print(f"❌ Error: Invalid SUPABASE_URL: {SUPABASE_URL}")
        sys.exit(1)
    
    print(f"✅ Config valid: {SUPABASE_URL[:50]}...")
    
    # Test connection
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        test = client.table("guides").select("id", count="exact").limit(1).execute()
        print("✅ Connection successful")
        return client
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

# ============================================================================
# DELETION
# ============================================================================

def delete_tables(client, force=False):
    """Delete all data from tables."""
    
    if not force:
        print("\n" + "="*80)
        print("⚠️  WARNING: THIS WILL DELETE ALL DATA!")
        print("="*80)
        print("\nTables to be cleared:")
        for i, table in enumerate(TABLES, 1):
            print(f"  {i:2}. {table}")
        
        print("\n" + "="*80)
        ans1 = input("Type 'yes' to proceed: ").strip().lower()
        if ans1 != "yes":
            print("❌ Cancelled")
            return False
        
        ans2 = input("Type 'DELETE ALL DATA' to confirm: ").strip()
        if ans2 != "DELETE ALL DATA":
            print("❌ Cancelled")
            return False
    else:
        print("⚠️  FORCE MODE - Skipping confirmations")
    
    # Delete
    print("\n🔥 Deleting data...")
    deleted = {}
    failed = []
    
    for i, table in enumerate(TABLES, 1):
        try:
            print(f"[{i:2}/{len(TABLES)}] {table:40}", end=" ", flush=True)
            response = client.table(table).delete().neq("id", -999999).execute()
            count = getattr(response, 'count', 0) or 0
            deleted[table] = count
            print(f"✅ ({count})")
        except Exception as e:
            if "does not exist" in str(e) or "relation" in str(e):
                deleted[table] = 0
                print("⏭️  (empty)")
            else:
                deleted[table] = -1
                failed.append(table)
                print(f"❌ {str(e)[:40]}")
    
    # Summary
    print("\n" + "="*80)
    total = sum(v for v in deleted.values() if v >= 0)
    print(f"✨ Total deleted: {total} rows")
    print(f"⚠️  Failed: {len(failed)} tables" if failed else "✅ All successful!")
    
    if failed:
        print(f"\nFailed tables: {', '.join(failed)}")
    
    print("="*80)
    return len(failed) == 0

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Main execution."""
    print("="*80)
    print("  🔥 SUPABASE DATABASE RESET 🔥")
    print("="*80)
    
    print("\n1️⃣  Validating configuration...")
    client = validate()
    
    print("\n2️⃣  Processing deletion...")
    force = "--force" in sys.argv
    success = delete_tables(client, force=force)
    
    if success:
        print("\n✅ ✨ Database reset completed successfully! ✨")
        print("🎉 Ready for production testing!")
    else:
        print("\n⚠️  Some tables failed to delete")
        print("📝 Check the errors above and retry")
    
    return 0 if success else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
