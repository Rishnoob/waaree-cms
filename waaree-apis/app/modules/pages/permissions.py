from app.core.permissions import Permission

PERMISSIONS = [
    Permission("pages.view", "See pages and their history", default_roles=("Admin", "Editor", "Approver")),
    Permission(
        "pages.edit",
        "Create pages, edit drafts and submit them for approval",
        default_roles=("Admin", "Editor"),
    ),
    Permission(
        "pages.approve",
        "Approve or reject pages submitted by others, and publish",
        default_roles=("Admin", "Approver"),
    ),
]
