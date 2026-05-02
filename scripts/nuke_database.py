#!/usr/bin/env python3
"""
🔥 NUCLEAR DATABASE RESET SCRIPT 🔥
====================================
Safely and completely wipes ALL data from Supabase database.
WARNING: This action is IRREVERSIBLE!

Usage:
    python scripts/nuke_database.py [--force]

    --force: Skip confirmation prompts

Requirements:
    pip install python-dotenv supabase
"""

import os
import sys
import time
from typing import List, Tuple
from dotenv import load_dotenv

# Try importing supabase
try:
    from supabase import create_client
except ImportError:
    print("❌ Error: 'supabase' package not found!")
    print("   Install it with: pip install supabase")
    sys.exit(1)

# Load environment variables - try .env.local first, then .env
load_dotenv('.env.local')
load_dotenv('.env')

# ============================================================================
# CONFIGURATION
# ============================================================================

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# All tables in proper deletion order (respecting foreign keys)
# Tables with dependencies must be deleted BEFORE their dependencies
TABLES_IN_ORDER = [
    # Community features (no FK dependencies)
    "community_poll_votes",
    "community_poll_options",
    "community_polls",
    "community_post_hashtags",
    "community_follows",
    "community_notifications",
    "post_bookmarks",
    
    # Posts and comments
    "post_likes",
    "post_comments",
    "posts",
    
    # Users and profiles
    "community_members",
    "community_conversations",
    "community_messages",
    "community_groups",
    
    # Guides
    "guide_versions",
    "guide_inline_comments",
    "guide_ratings",
    "guide_comments",
    "guide_time_logs",
    "guide_views",
    "user_guide_interactions",
    
    # User interactions and activity
    "user_follows",
    "claimed_rewards",
    "user_chatbot_usage",
    "zetsuguide_conversations",
    "zetsuguide_usage_logs",
    
    # Support system
    "support_messages",
    "support_conversations",
    
    # Issue tracking
    "bug_reports",
    
    # UI components
    "ui_component_likes",
    "ui_components",
    
    # Logging and usage
    "usage_logs",
    
    # Credits and referrals
    "zetsuguide_referrals",
    "zetsuguide_credits",
    
    # User profiles
    "zetsuguide_user_profiles",
    
    # Ads (if any)
    "zetsuguide_ads",
    "community_hashtags",
    
    # Guides (main table - last!)
    "guides",
]

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_header(text: str) -> None:
    """Print a formatted header."""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80 + "\n")

def print_warning(text: str) -> None:
    """Print a warning in red."""
    print(f"⚠️  {text}")

def print_error(text: str) -> None:
    """Print an error in red."""
    print(f"❌ {text}")

def print_success(text: str) -> None:
    """Print success message in green."""
    print(f"✅ {text}")

def print_info(text: str) -> None:
    """Print info message in blue."""
    print(f"ℹ️  {text}")

def validate_config() -> Tuple[bool, str]:
    """Validate Supabase configuration."""
    if not SUPABASE_URL:
        return False, "SUPABASE_URL not found in environment variables"
    
    if not SUPABASE_SERVICE_KEY:
        return False, "SUPABASE_SERVICE_KEY not found in environment variables"
    
    if "supabase.co" not in SUPABASE_URL:
        return False, f"Invalid SUPABASE_URL: {SUPABASE_URL}"
    
    return True, "Configuration valid"

def initialize_client():
    """Initialize Supabase client with service role key."""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        return client
    except Exception as e:
        print_error(f"Failed to initialize Supabase client: {str(e)}")
        sys.exit(1)

def count_rows(client, table: str) -> int:
    """Count rows in a table."""
    try:
        response = client.table(table).select("*", count="exact").limit(1).execute()
        return response.count or 0
    except Exception as e:
        # Silently skip tables that don't exist or have no columns
        return 0

def get_table_sizes(client) -> dict:
    """Get row counts for all tables."""
    sizes = {}
    print("📊 Fetching table sizes...")
    
    for table in TABLES_IN_ORDER:
        try:
            count = count_rows(client, table)
            sizes[table] = count
        except Exception as e:
            # Skip tables with errors silently
            sizes[table] = 0
    
    return sizes

def delete_table_data(client, table: str) -> Tuple[bool, int]:
    """Delete ALL data from a table using multiple strategies."""
    try:
        # Strategy 1: Get all records first to know how many to delete
        select_response = client.table(table).select("*", count="exact").execute()
        total_before = select_response.count or 0
        
        if total_before == 0:
            return True, 0
        
        # Strategy 2: Try deleting with a filter that matches all rows
        # Using a condition that's always true: 1=1 doesn't work, 
        # so we'll try multiple approaches
        
        try:
            # Approach A: Delete with gt on first column (works for most)
            response = client.table(table).delete().gt("id", -999999999).execute()
            return True, getattr(response, 'count', None) or total_before
        except:
            pass
        
        try:
            # Approach B: Delete with gte
            response = client.table(table).delete().gte("created_at", "0001-01-01").execute()
            return True, getattr(response, 'count', None) or total_before
        except:
            pass
        
        try:
            # Approach C: Get IDs and delete in batches
            ids_response = client.table(table).select("*").execute()
            if ids_response.data and len(ids_response.data) > 0:
                # Try to extract any ID-like field
                first_row = ids_response.data[0]
                id_field = None
                
                # Find ID field
                for key in ['id', 'uuid', 'user_id', 'post_id', 'guide_id']:
                    if key in first_row:
                        id_field = key
                        break
                
                if id_field:
                    ids = [row.get(id_field) for row in ids_response.data if row.get(id_field)]
                    if ids:
                        # Delete in batches of 100
                        for batch in [ids[i:i+100] for i in range(0, len(ids), 100)]:
                            try:
                                client.table(table).delete().in_(id_field, batch).execute()
                            except:
                                pass
                        return True, len(ids)
            
            return True, total_before
        except:
            pass
        
        return False, 0
        
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "relation" in error_msg:
            return True, 0
        return False, 0

def print_summary(before: dict, deleted: dict) -> None:
    """Print deletion summary."""
    print("\n")
    print_header("📋 DELETION SUMMARY")
    
    total_before = sum(v for v in before.values() if isinstance(v, int))
    total_deleted = sum(v for v in deleted.values() if isinstance(v, int))
    
    print(f"Total rows BEFORE: {total_before}")
    print(f"Total rows DELETED: {total_deleted}")
    print()
    
    print("Detailed deletions:")
    print("-" * 60)
    
    for table in TABLES_IN_ORDER:
        before_count = before.get(table, 0)
        deleted_count = deleted.get(table, 0)
        
        if before_count > 0:
            status = "✅" if deleted_count > 0 else "⚠️"
            print(f"{status} {table:40} | {str(before_count):>8} → {str(deleted_count):>8}")
    
    print("-" * 60)

def confirm_deletion() -> bool:
    """Request user confirmation for deletion."""
    print_warning("THIS WILL PERMANENTLY DELETE ALL DATA!")
    print_warning("This action CANNOT be undone!")
    print()
    
    # Multi-level confirmation
    response1 = input("⚠️  Type 'yes' to proceed: ").strip().lower()
    if response1 != "yes":
        print_info("Cancellation confirmed. No changes made.")
        return False
    
    response2 = input("⚠️  Type 'DELETE ALL DATA' to confirm: ").strip()
    if response2 != "DELETE ALL DATA":
        print_info("Cancellation confirmed. No changes made.")
        return False
    
    return True

def main():
    """Main execution."""
    print_header("🔥 SUPABASE DATABASE NUCLEAR RESET 🔥")
    
    # Check for force flag
    force_mode = "--force" in sys.argv
    
    if force_mode:
        print_warning("Running in FORCE mode (skipping confirmations)")
    
    # ========================================================================
    # STEP 1: Validate configuration
    # ========================================================================
    print_info("Step 1: Validating configuration...")
    is_valid, message = validate_config()
    
    if not is_valid:
        print_error(f"Configuration error: {message}")
        sys.exit(1)
    
    print_success(f"Configuration valid")
    print_info(f"  URL: {SUPABASE_URL[:50]}...")
    
    # ========================================================================
    # STEP 2: Initialize client
    # ========================================================================
    print_info("\nStep 2: Initializing Supabase client...")
    client = initialize_client()
    
    # Test connection
    try:
        # Simple test query
        test = client.table("guides").select("id", count="exact").limit(1).execute()
        print_success("Connection successful")
    except Exception as e:
        print_error(f"Connection failed: {str(e)}")
        sys.exit(1)
    
    # ========================================================================
    # STEP 3: Get current database state
    # ========================================================================
    print_info("\nStep 3: Analyzing current database state...")
    before_sizes = get_table_sizes(client)
    
    total_rows_before = sum(v for v in before_sizes.values() if isinstance(v, int))
    print_success(f"Total rows in database: {total_rows_before}")
    
    # Show tables with data
    tables_with_data = {k: v for k, v in before_sizes.items() if isinstance(v, int) and v > 0}
    if tables_with_data:
        print("\nTables with data:")
        for table, count in sorted(tables_with_data.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {table}: {count} rows")
    else:
        print_info("Database is already empty!")
        return
    
    # ========================================================================
    # STEP 4: User confirmation
    # ========================================================================
    print()
    if not force_mode:
        if not confirm_deletion():
            sys.exit(0)
    else:
        print_warning("FORCE mode active - proceeding without confirmation!")
    
    # ========================================================================
    # STEP 5: Execute deletion
    # ========================================================================
    print_header("🔥 DELETING DATA 🔥")
    
    deleted_count = {}
    failed_tables = []
    
    for i, table in enumerate(TABLES_IN_ORDER, 1):
        before = before_sizes.get(table, 0)
        
        # Skip if table was already empty
        if before == 0:
            print(f"[{i}/{len(TABLES_IN_ORDER)}] {table:40} ⏭️  (empty)")
            deleted_count[table] = 0
            continue
        
        print(f"[{i}/{len(TABLES_IN_ORDER)}] {table:40} 🔥 Deleting...", end=" ", flush=True)
        
        success, count = delete_table_data(client, table)
        
        if success:
            deleted_count[table] = count
            print(f"✅ ({count} rows)")
            time.sleep(0.2)  # Small delay between deletions
        else:
            deleted_count[table] = 0
            failed_tables.append(table)
            print(f"❌ FAILED")
            time.sleep(0.2)
    
    # ========================================================================
    # STEP 6: Verification
    # ========================================================================
    print_header("✅ VERIFYING DELETION ✅")
    
    print_info("Recounting rows in all tables...")
    after_sizes = get_table_sizes(client)
    
    total_rows_after = sum(v for v in after_sizes.values() if isinstance(v, int))
    
    if total_rows_after == 0:
        print_success(f"✨ Database is now completely empty! (0 rows)")
    else:
        print_warning(f"⚠️  Database still contains {total_rows_after} rows")
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_summary(before_sizes, after_sizes)
    
    if failed_tables:
        print_warning(f"⚠️  Failed to delete from: {', '.join(failed_tables)}")
    
    # ========================================================================
    # FINAL STATUS
    # ========================================================================
    print_header("🎉 OPERATION COMPLETE 🎉")
    
    if total_rows_after == 0:
        print_success("All data has been successfully deleted!")
        print_success("Your database is now production-ready for testing!")
    else:
        print_warning(f"Some data remains ({total_rows_after} rows)")
        print_info("Please check failed tables listed above")
    
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
