from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication


class QueryStringJWTAuthMiddleware:
  def __init__(self, inner):
    self.inner = inner

  def __call__(self, scope):
    return QueryStringJWTAuthMiddlewareInstance(scope, self.inner)


class QueryStringJWTAuthMiddlewareInstance:
  def __init__(self, scope, inner):
    self.scope = dict(scope)
    self.inner = inner

  async def __call__(self, receive, send):
    query_string = self.scope.get('query_string', b'').decode()
    query_params = parse_qs(query_string)
    token_list = query_params.get('token', [])
    user = AnonymousUser()

    if token_list:
      token = token_list[0]
      user = await get_user_for_token(token)

    self.scope['user'] = user
    inner = self.inner(self.scope)
    return await inner(receive, send)


@database_sync_to_async
def get_user_for_token(token: str):
  authenticator = JWTAuthentication()
  try:
    validated = authenticator.get_validated_token(token)
    return authenticator.get_user(validated)
  except Exception:
    return AnonymousUser()


