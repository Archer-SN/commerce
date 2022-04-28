
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("error", views.error_view, name="error"),

    path("profile/<int:user_id>",
         views.profile_view, name="profile"),
    path("following", views.following_view, name="following"),

    path("post", views.post, name="post"),
    path("comment", views.comment, name="comment"),

    # Handling likes for both post and comment
    path("like", views.like, name="like")

]
