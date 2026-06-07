"""Routes package."""

from .auth import router as authRouter
from .users import router as usersRouter
from .products import router as productsRouter
from .verify import router as verifyRouter
from .reports import router as reportsRouter

__all__ = ["authRouter", "usersRouter", "productsRouter", "verifyRouter", "reportsRouter"]
