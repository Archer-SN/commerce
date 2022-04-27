from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    following = models.ManyToManyField(
        "self", null=True, blank=True, symmetrical=False, related_name="follower")
    liked_post = models.ManyToManyField(
        "Post", null=True, blank=True, related_name="liked_user")
    liked_comment = models.ManyToManyField(
        "Comment", null=True, blank=True, related_name="liked_user")

    @property
    def total_followers(self):
        return User.objects.filter(following=self).count()

    @property
    def total_following(self):
        return self.following.count()


# A base model for post and comment
class BaseModel(models.Model):
    content = models.TextField()
    likes = models.PositiveIntegerField(default=0)
    date_created = models.DateTimeField(auto_now_add=True)

    def change_content(self, new_content):
        self.content = new_content

    def add_like(self):
        self.likes += 1

    def remove_like(self):
        self.likes -= 1

    class Meta:
        abstract = True


class Post(BaseModel):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="post")


class Comment(BaseModel):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="comment")
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="comment")
