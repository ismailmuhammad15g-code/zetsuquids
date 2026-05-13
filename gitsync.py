import os
import subprocess
import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm

# Initialize terminal UI
console = Console()

def run_git_command(command: list, capture_error: bool = False) -> tuple:
    """
    Executes Git commands in the system and captures output or errors.
    Using lists instead of strings prevents shell injection vulnerabilities.
    """
    try:
        result = subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        if capture_error:
            return False, e.stderr.strip()
        return False, ""

def check_git_repository() -> bool:
    """Checks if the current directory contains a Git repository."""
    success, _ = run_git_command(["git", "rev-parse", "--is-inside-work-tree"])
    return success

def display_git_status() -> bool:
    """
    Fetches file status and parses it to build a UI table showing
    modified, new, and deleted files.
    """
    success, output = run_git_command(["git", "status", "--short"])
    
    if not success:
        console.print("[bold red]❌ Error: Failed to read Git status.[/bold red]")
        return False

    if not output:
        console.print(Panel("[bold green]✨ Repository is clean! No modified files.[/bold green]", border_style="green"))
        return False

    lines = output.split('\n')
    
    # Build UI Table
    table = Table(title="📊 Current File Changes", show_header=True, header_style="bold cyan")
    table.add_column("Status", style="dim", width=15)
    table.add_column("File Path", justify="left")

    added_count = 0
    modified_count = 0
    deleted_count = 0

    for line in lines:
        if len(line) < 3:
            continue
        status_code = line[:2]
        file_path = line[3:]

        # Parse Git short status codes
        if "??" in status_code:
            status_text = "[bold magenta]Untracked[/bold magenta]"
            added_count += 1
        elif "M" in status_code:
            status_text = "[bold yellow]Modified[/bold yellow]"
            modified_count += 1
        elif "D" in status_code:
            status_text = "[bold red]Deleted[/bold red]"
            deleted_count += 1
        elif "A" in status_code:
            status_text = "[bold green]Added[/bold green]"
            added_count += 1
        else:
            status_text = f"[bold white]{status_code}[/bold white]"

        table.add_row(status_text, file_path)

    # Display statistics panel
    stats_panel = Panel(
        f"[bold yellow]Modified:[/bold yellow] {modified_count} | "
        f"[bold magenta]Untracked:[/bold magenta] {added_count} | "
        f"[bold red]Deleted:[/bold red] {deleted_count}",
        title="Changes Summary",
        border_style="cyan"
    )

    console.print(stats_panel)
    console.print(table)
    return True

def save_work():
    """Core function to Add, Commit, and Push with error handling."""
    # 1. Prompt for commit message
    commit_msg = Prompt.ask("\n[bold cyan]📝 Enter commit message[/bold cyan]")
    
    if not commit_msg.strip():
        console.print("[bold red]❌ Commit message cannot be empty. Aborted.[/bold red]")
        sys.exit(1)

    # 2. Add files
    console.print("\n[bold dim]⏳ Adding files (git add .)...[/bold dim]")
    add_success, _ = run_git_command(["git", "add", "."])
    if not add_success:
        console.print("[bold red]❌ Failed to add files.[/bold red]")
        sys.exit(1)

    # 3. Commit changes
    console.print("[bold dim]⏳ Committing changes (git commit)...[/bold dim]")
    commit_success, commit_error = run_git_command(["git", "commit", "-m", commit_msg], capture_error=True)
    if not commit_success:
        console.print("[bold red]❌ Commit failed. There might be no actual changes.[/bold red]")
        console.print(f"[dim]{commit_error}[/dim]")
        sys.exit(1)
    
    console.print("[bold green]✅ Committed locally with success![/bold green]")

    # 4. Push to remote
    push_success, push_error = run_git_command(["git", "push", "origin", "HEAD"], capture_error=True)
    
    if push_success:
        console.print(Panel("[bold green]🚀 Code pushed to origin successfully![/bold green]", border_style="green"))
    else:
        # 5. Handle push error and offer Force Push option
        console.print(Panel(f"[bold red]⚠️ Push failed![/bold red]\n\n[dim]{push_error}[/dim]", border_style="red"))
        
        force_push = Confirm.ask("[bold yellow]Do you want to force push?[/bold yellow]", default=False)
        
        if force_push:
            console.print("[bold dim]⏳ Force pushing (git push --force)...[/bold dim]")
            force_success, force_error = run_git_command(["git", "push", "origin", "HEAD", "--force"], capture_error=True)
            
            if force_success:
                console.print(Panel("[bold green]🚀 Force push successful![/bold green]", border_style="green"))
            else:
                console.print("[bold red]❌ Force push failed:[/bold red]")
                console.print(f"[dim]{force_error}[/dim]")
        else:
            console.print("[bold cyan]Aborted. Your changes are only saved locally.[/bold cyan]")

def main():
    # Clean terminal screen based on OS
    os.system('cls' if os.name == 'nt' else 'clear')
    
    console.print(Panel.fit("[bold cyan]🤖 AI Auto-Git CLI[/bold cyan]", border_style="cyan"))

    # Check if inside a Git repo
    if not check_git_repository():
        console.print("[bold red]❌ Error: Current directory is not a Git repository.[/bold red]")
        sys.exit(1)

    # Display status
    has_changes = display_git_status()

    if not has_changes:
        sys.exit(0)

    # Prompt user to save
    should_save = Confirm.ask("\n[bold green]Do you want to save and push your work now?[/bold green]", default=True)
    
    if should_save:
        save_work()
    else:
        console.print("[bold dim]Aborted. See you later![/bold dim]")

if __name__ == "__main__":
    # Prevent ugly stack trace on Ctrl+C
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[bold red]Process interrupted by user.[/bold red]")
        sys.exit(0)