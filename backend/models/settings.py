class Settings:
    def __init__(self, db, supabase):
        self.collection = db["users"]
        self.supabase = supabase
        self.notifications = False


    def swap_notifications(self):
        if self.notification == False:
            self.notification = True
        else:
            self.notification = False

    def reset_password(self):
        #TODO
        pass

    def logout(self):
        #TODO
        pass

    def delete_account(self):
        #TODO
        pass
    