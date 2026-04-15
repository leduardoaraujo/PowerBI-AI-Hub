import logging

logger = logging.getLogger(__name__)

WRITE_OPERATIONS: dict[str, set[str]] = {
    "measure_operations": {"create", "update", "delete", "rename", "move"},
    "table_operations": {"create", "update", "delete", "rename"},
    "column_operations": {"create", "update", "delete", "rename"},
    "relationship_operations": {"create", "update", "delete", "activate", "deactivate"},
    "partition_operations": {"create", "update", "delete", "refresh"},
    "calculation_group_operations": {"create", "update", "delete"},
    "security_role_operations": {"create", "update", "delete"},
    "perspective_operations": {"create", "update", "delete"},
    "named_expression_operations": {"create", "update", "delete"},
    "function_operations": {"create", "update", "delete"},
    "culture_operations": {"create", "update", "delete"},
    "object_translation_operations": {"create", "update", "delete"},
    "calendar_operations": {"create", "update", "delete"},
    "query_group_operations": {"create", "update", "delete"},
    "user_hierarchy_operations": {"create", "update", "delete"},
    "database_operations": {"update", "create", "deploy"},
    "transaction_operations": {"begin", "commit", "rollback"},
}

WRITE_ONLY_TOOLS: set[str] = set()


def classify_tool(tool_name: str, arguments: dict) -> str:
    operation = arguments.get("operation", "").lower() if arguments else ""

    if tool_name in WRITE_ONLY_TOOLS:
        return "write"

    if tool_name in WRITE_OPERATIONS:
        if operation in WRITE_OPERATIONS[tool_name]:
            return "write"
        if operation and operation not in _get_read_operations(tool_name):
            return "write"

    return "read"


def _get_read_operations(tool_name: str) -> set[str]:
    known_read: dict[str, set[str]] = {
        "measure_operations": {"get", "list"},
        "table_operations": {"get", "list", "refresh"},
        "column_operations": {"get", "list"},
        "relationship_operations": {"get", "list", "find"},
        "database_operations": {"get", "list", "import"},
        "connection_operations": {"list", "get"},
        "dax_query_operations": {"execute", "validate", "generate"},
        "trace_operations": {"list", "get"},
        "partition_operations": {"get", "list"},
        "security_role_operations": {"get", "list"},
        "perspective_operations": {"get", "list"},
        "named_expression_operations": {"get", "list"},
        "function_operations": {"get", "list"},
        "culture_operations": {"get", "list"},
        "object_translation_operations": {"get", "list"},
        "calendar_operations": {"get", "list"},
        "query_group_operations": {"get", "list"},
        "user_hierarchy_operations": {"get", "list"},
    }
    return known_read.get(tool_name, set())


def enrich_tool_info(tool: dict) -> dict:
    name = tool.get("name", "")
    classification = _classify_tool_by_name(name)
    tool["classification"] = classification
    return tool


def _classify_tool_by_name(name: str) -> str:
    if name in WRITE_ONLY_TOOLS:
        return "write"
    if name in WRITE_OPERATIONS or name == "transaction_operations":
        return "mixed"
    return "read"
