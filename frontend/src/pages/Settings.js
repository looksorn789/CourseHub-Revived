import React, { useState } from "react";
import Input from "../components/ui/Input"; 
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom"; 
import { requestResetPassword, deleteAccount } from "../services/authService"; 
import Button from "../components/ui/Button"; 
import CustomLoader from "../components/ui/CustomLoader"; 
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";


const Settings = () => {
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [email, setEmail] = useState(""); 
    const [isLoading, setIsLoading] = useState(false); 
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState(""); 
    const navigate = useNavigate(); 

    const toggleSection = (section) => {
        switch (section) {
            case "password":
                setIsPasswordOpen(!isPasswordOpen);
                break;
            case "account":
                setIsAccountOpen(!isAccountOpen);
                break;
            case "notification":
                setIsNotificationOpen(!isNotificationOpen);
                break;
            default:
                break;
        }
    };

    const handleLogOut = () => {
        localStorage.removeItem("jwt_token");  
        localStorage.removeItem("user");
        navigate("/signin");
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("Are you sure you want to delete your account?");
        if (confirmed) {
            try {
                const user = JSON.parse(localStorage.getItem("user")); // Get the logged-in user data
                const email = user.email; // Extract email from user data
                await deleteAccount(email); // Call the deleteAccount function
                console.log("Account deleted.");
    
                // Log out the user and clear local storage
                handleLogOut();
            } catch (error) {
                console.error("Error deleting account:", error.message);
            }
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
          await requestResetPassword(email);
          setIsLoading(false);
          setIsSubmitted(true);
        } catch (err) {
          const errorMessage =
            err.message || "Something went wrong, please try again.";
          if (errorMessage.includes("Email not found")) {
            setError(
              "The email you entered is not registered. Please try again with a registered email.",
            );
          } else {
            setError(errorMessage);
          }
          setIsLoading(false);
        }
      };

      const handleNotifications = async() => { //CANNOT WORK ON THIS YET UNTIL PROFILE IS FINISHED, AND FORUM SINCE I NEED TO SUBSCRIBE TO THE FORUMS
      }

    const styles = {
        outerContainer: {
            backgroundColor: "#e8f4f8",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column", // Stack children vertically
            justifyContent: "flex-start", // Align items at the top
            
        },

        settingsText: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            fontSize: '16px',
            fontWeight: '400',
            lineHeight: '1.5',
            color: '#333',
          },
          
        settingsContainer: {
            width: "80%",
            minHeight: "75vh",
            justifyContent: "center",
            margin: "5rem auto 0 auto",
            padding: "3.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            boxSizing: "border-box",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        },
        settingsHeading: {
            fontFamily: "'Arial', sans-serif",
            textAlign: "center",
            fontWeight: "600",
            color: "#446B51",
            fontSize: "1.5rem",
            letterSpacing: "0.05rem",
            textTransform: "capitalize",
        },
        settingItem: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "100%",
            marginBottom: "1rem", //increase spacing between buttons
            marginTop: "6rem", // Added margin to push buttons down further
            display: "flex",
            justifyContent: "center", 
            alignItems: "center", 
            flexDirection: "column", 
            textAlign: "center", 
        },
        settingBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "50%",
            padding: "1rem",
            fontSize: "1rem",
            backgroundColor: "#E0E0E0",
            fontWeight: "550",
            border: "1px solid #7ca38e",
            color: "#000000",
            cursor: "pointer",
            textAlign: "left",
            borderRadius: "5px",
            transition: "background-color 0.3s ease",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        },
        ResetAccountBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "21%",
            backgroundColor: "#205836",
            color: "white",
            padding: "1.3rem 2rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        settingContent: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            display: isPasswordOpen || isAccountOpen || isNotificationOpen ? 'block' : 'none',
            width: "50%",
            margin: "0 auto", 
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "2rem", 
            boxSizing: "border-box",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", 
        },
        passwordInput: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "100%",
            padding: "0.5rem",
            margin: "-1rem 0", 
            fontSize: "0.9rem", 
            borderRadius: "8px",
        },
        buttonGroup: {
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            marginTop: "1.5rem",
            gap: "2rem",
        },
        inputbox: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "100%",
            height: "3rem", 
            padding: "1rem",
            margin: "0.5rem 0", 
            fontSize: "1rem", 
            borderRadius: "8px",
            border: "1px solid #7ca38e",
        },
        logOutBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "20%",
            backgroundColor: "#205836",
            color: "white",
            padding: "0.35rem 2rem",
            fontSize: "1rem",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        DeleteBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "30%",
            backgroundColor: "#205836",
            color: "white",
            padding: "0.45rem 2rem",
            fontSize: "1rem",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        cancelBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "20%",
            color: "black",
            padding: "0.5rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        submitBtn: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            width: "25%",
            backgroundColor: "#205836",
            color: "white",
            padding: "0.5rem 2rem",
            fontSize: "1.1rem",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        notificationPreference: {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start", 
            margin: "0 auto", 
        },
        checkbox: {
            width: "20px", 
            height: "20px", 
            marginLeft: "0.5rem", 
        },
        notificationLabel: {
            fontFamily: "'Arial', Helvetica, sans-serif;",
            fontSize: "1rem", 
            color: "#000", 
        },
    };

    return (

        <div style={styles.outerContainer}> {/* Outer container for the entire Settings page */}

        <Header /> {/* Header remains at the top */}
        <div style={styles.settingsContainer}> {/* Settings container below the header */}
            <p style={styles.settingsHeading}>Settings</p>
            {/* Password section */}
            <div style={styles.settingItem}>
                <button
                    style={styles.settingBtn}
                    onClick={() => toggleSection("password")}
                >
                    Password {isPasswordOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
                {isPasswordOpen && (
                    <div style={styles.settingContent}>
                        <div style={styles.passwordInput}>
                        {!isSubmitted ? (
                            <form onSubmit={handleEmailSubmit}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Input
                                        type="email"
                                        id="email-address"
                                        name="email"
                                        autoComplete="email"
                                        placeholder="Enter your Email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={styles.inputbox}
                                    />
                                    {error && <p style={{ color: "red" }}>{error}</p>}
                                </div>
                                
                                <div style={styles.buttonGroup}>
                                    <button
                                        type="button"
                                        style={styles.cancelBtn}
                                        onClick={() => toggleSection("password")}
                                    >
                                        Cancel
                                    </button>
                                    <Button type="submit" disabled={isLoading} style={styles.ResetAccountBtn}>
                                    {isLoading ? (
                                        <>
                                        <CustomLoader />
                                        <span className="ml-2">Sending...</span>
                                    </>
                                    ) : (
                                        <>
                                        Reset Password
                                        </>
                                      )}
                                    </Button>
                                </div>
                            </form>
                            
                       ) : (
                        <div className="mt-8 space-y-6">
                          <div className="rounded-2xl bg-white shadow-xl p-8 space-y-6">
                            <div className="flex items-center justify-center text-green-600">
                              <CheckCircle className="h-12 w-12" />
                            </div>
                            <p className="text-center text-gray-700">
                              We've sent a password reset link to <strong>{email}</strong>.
                              Please check your inbox and follow the instructions to reset
                              your password.
                            </p>
                          </div>
                        </div>
                      )}
                      </div>
                      </div>
                )}</div>

            {/* Notification preferences section */}
            <div style={styles.settingItem}>
                <button
                    style={styles.settingBtn}
                    onClick={() => toggleSection("notification")}
                >
                    Notification Preferences {isNotificationOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
                {isNotificationOpen && (
                    <div style={styles.settingContent}>
                        <div style={styles.notificationPreference}>
                            <label htmlFor="notification" style={styles.notificationLabel}>
                                Notification for mentions?
                            </label>
                            <input 
                                type="checkbox" 
                                id="notification" 
                                style={styles.checkbox} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Account management section */}
            <div style={styles.settingItem}>
                <button
                    style={styles.settingBtn}
                    onClick={() => toggleSection("account")}
                >
                    Manage Your Account {isAccountOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
                {isAccountOpen && (
                    <div style={styles.settingContent}>
                        <div style={styles.buttonGroup}>
                            <button
                                type="button"
                                style={styles.logOutBtn}
                                onClick={handleLogOut}
                            >
                                Log Out
                            </button>
                            <Button
                                type="reset"
                                disabled={isLoading}
                                style={styles.DeleteBtn}
                                onClick={handleDeleteAccount}
                            >
                                {isLoading ? <CustomLoader /> : "Delete Your Account"}
                        </Button>
                        </div>
                    </div>
                )}
            </div>
    </div>
</div>
                );
            };

export default Settings;
