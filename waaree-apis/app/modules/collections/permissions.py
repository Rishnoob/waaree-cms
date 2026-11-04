from app.core.permissions import Permission

PERMISSIONS = [
    Permission("data.view", "See collections and their rows", default_roles=("Admin", "Editor", "Approver")),
    Permission(
        "data.edit",
        "Add and edit rows; create collections and add fields (adding never removes anything)",
        default_roles=("Admin", "Editor"),
    ),
    Permission(
        "data.publish",
        "Publish rows (and approve rows sent for approval by others)",
        default_roles=("Admin", "Approver"),
    ),
    Permission(
        "data.structure",
        "Change collections: rename, approval, archive; rename, hide or reorder fields",
        default_roles=("Admin",),
    ),
]
