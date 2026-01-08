import logging
import os
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

from . import tools

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-obsidian")

api_key = os.getenv("OBSIDIAN_API_KEY")
if not api_key:
    raise ValueError(f"OBSIDIAN_API_KEY environment variable required. Working directory: {os.getcwd()}")

# Create FastMCP server with streamable HTTP configuration
mcp = FastMCP(
    "mcp-obsidian",
    host="0.0.0.0",
    port=3000,
)

# Tool handlers registry
tool_handlers = {}

def add_tool_handler(tool_class: tools.ToolHandler):
    global tool_handlers
    tool_handlers[tool_class.name] = tool_class

def get_tool_handler(name: str) -> tools.ToolHandler | None:
    if name not in tool_handlers:
        return None
    return tool_handlers[name]

# Register all tool handlers
add_tool_handler(tools.ListFilesInDirToolHandler())
add_tool_handler(tools.ListFilesInVaultToolHandler())
add_tool_handler(tools.GetFileContentsToolHandler())
add_tool_handler(tools.SearchToolHandler())
add_tool_handler(tools.PatchContentToolHandler())
add_tool_handler(tools.AppendContentToolHandler())
add_tool_handler(tools.PutContentToolHandler())
add_tool_handler(tools.DeleteFileToolHandler())
add_tool_handler(tools.ComplexSearchToolHandler())
add_tool_handler(tools.BatchGetFileContentsToolHandler())
add_tool_handler(tools.PeriodicNotesToolHandler())
add_tool_handler(tools.RecentPeriodicNotesToolHandler())
add_tool_handler(tools.RecentChangesToolHandler())

# Register tools with FastMCP using decorators by wrapping existing handlers
for handler_name, handler in tool_handlers.items():
    tool_desc = handler.get_tool_description()

    # Create a wrapper function for each tool
    def make_tool_wrapper(h):
        def tool_wrapper(**kwargs):
            try:
                result = h.run_tool(kwargs)
                # Convert result to string if it's a list of TextContent
                if isinstance(result, list):
                    return "\n".join(item.text if hasattr(item, 'text') else str(item) for item in result)
                return result
            except Exception as e:
                logger.error(str(e))
                raise RuntimeError(f"Caught Exception. Error: {str(e)}")

        # Set function metadata for FastMCP
        tool_wrapper.__name__ = h.name
        tool_wrapper.__doc__ = tool_desc.description
        return tool_wrapper

    wrapper = make_tool_wrapper(handler)
    mcp.tool(name=handler_name, description=tool_desc.description)(wrapper)


def main():
    """Run the MCP server with streamable HTTP transport."""
    logger.info("Starting mcp-obsidian server on http://0.0.0.0:3000/mcp")
    mcp.run(transport="streamable-http")
