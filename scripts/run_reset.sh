#!/bin/bash

# ============================================================================
# 🔥 DATABASE RESET LAUNCHER 🔥
# ============================================================================
# This script makes it easy to run the database reset from the command line
# 
# Usage:
#   ./scripts/run_reset.sh          # Interactive mode
#   ./scripts/run_reset.sh --force  # Force mode (no prompts)
#   ./scripts/run_reset.sh --sql    # SQL method (direct)
# 
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ============================================================================
# FUNCTIONS
# ============================================================================

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  🔥 $1 🔥${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_menu() {
    echo -e "\n${BLUE}Choose reset method:${NC}\n"
    echo "  1) Python Script (Recommended) - Safe with confirmations"
    echo "  2) SQL Direct (Fastest) - Paste and execute in Supabase"
    echo "  3) View Documentation"
    echo "  4) Exit"
    echo ""
}

check_env_file() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        print_warning ".env file not found!"
        echo "  Copy from .env.example or create manually:"
        echo ""
        echo "  SUPABASE_URL=https://your-project.supabase.co"
        echo "  SUPABASE_SERVICE_KEY=your-service-role-key"
        echo ""
        return 1
    fi
    
    if ! grep -q "SUPABASE_URL" "$PROJECT_DIR/.env"; then
        print_error "SUPABASE_URL not found in .env"
        return 1
    fi
    
    if ! grep -q "SUPABASE_SERVICE_KEY" "$PROJECT_DIR/.env"; then
        print_error "SUPABASE_SERVICE_KEY not found in .env"
        return 1
    fi
    
    print_success ".env file is valid"
    return 0
}

check_python() {
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed!"
        echo "  Install with: sudo apt-get install python3"
        return 1
    fi
    
    print_success "Python 3 found: $(python3 --version)"
    return 0
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! python3 -c "import dotenv" 2>/dev/null; then
        print_warning "python-dotenv not installed"
        echo "  Installing: pip install -r $SCRIPT_DIR/requirements.txt"
        pip install -r "$SCRIPT_DIR/requirements.txt"
    fi
    
    if ! python3 -c "import supabase" 2>/dev/null; then
        print_warning "supabase package not installed"
        echo "  Installing: pip install supabase"
        pip install supabase
    fi
    
    print_success "All dependencies are available"
}

run_python() {
    local force_flag=""
    if [ "$1" = "--force" ]; then
        force_flag="--force"
    fi
    
    print_header "RUNNING PYTHON SCRIPT"
    
    if check_env_file && check_python && check_dependencies; then
        cd "$PROJECT_DIR"
        python3 "$SCRIPT_DIR/nuke_database.py" $force_flag
    else
        print_error "Setup failed. Please fix the errors above."
        return 1
    fi
}

show_sql_script() {
    print_header "SQL SCRIPT"
    
    echo -e "${YELLOW}Steps:${NC}"
    echo "1. Copy the SQL script below"
    echo "2. Go to Supabase Dashboard → SQL Editor"
    echo "3. Paste and click Execute"
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    cat "$SCRIPT_DIR/RESET_DATABASE.sql"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
}

show_info() {
    if command -v less &> /dev/null; then
        less "$SCRIPT_DIR/RESET_COMPLETE_GUIDE.md"
    else
        cat "$SCRIPT_DIR/RESET_COMPLETE_GUIDE.md"
    fi
}

# ============================================================================
# MAIN
# ============================================================================

main() {
    print_header "DATABASE RESET TOOL"
    
    # Check for command-line arguments
    if [ "$1" = "--force" ]; then
        print_warning "Force mode enabled"
        run_python "--force"
        return
    elif [ "$1" = "--sql" ]; then
        show_sql_script
        return
    elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --force         Run without confirmations"
        echo "  --sql          Show SQL script"
        echo "  --help         Show this help message"
        echo ""
        echo "Run without options for interactive menu"
        return
    fi
    
    # Interactive menu
    while true; do
        show_menu
        read -p "Enter choice [1-4]: " choice
        
        case $choice in
            1)
                run_python
                break
                ;;
            2)
                show_sql_script
                break
                ;;
            3)
                show_info
                break
                ;;
            4)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
    done
}

# Make sure we're in the project directory
cd "$PROJECT_DIR"

# Run main
main "$@"
