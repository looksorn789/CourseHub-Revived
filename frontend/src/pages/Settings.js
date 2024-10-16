import React, { useState } from "react";
import Input from "../components/ui/Input"; 
import Header from "../components/layout/Header";
import { useNavigate } from "react-router-dom"; 
import { requestResetPassword, deleteAccount } from "../services/authService"; // Import the new deleteAccount function
import Button from "../components/ui/Button"; 
import CustomLoader from "../components/ui/CustomLoader"; 

const Settings = () => {
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [email, setEmail] = useState(""); 
    const [isLoading, setIsLoading] = useState(false); 
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
        console.log("Logged out");
        navigate("/"); 
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("Are you sure you want to delete your account?");
        if (confirmed) {
            try {
                const email = "user@example.com"; // Replace this with the actual email
                await deleteAccount(email); // Call the deleteAccount function
                console.log("Account deleted."); // Handle success (e.g., navigate to another page)
            } catch (error) {
                console.error("Error deleting account:", error.message); // Handle error appropriately
            }
        }
        navigate("/");
        
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await requestResetPassword(email);
            setIsLoading(false);
            alert("A reset link has been sent to your email.");
            navigate("/reset-password"); 
        } catch (err) {
            const errorMessage = err.message || "Something went wrong, please try again.";
            if (errorMessage.includes("Email not found")) {
                setError("The email you entered is not registered. Please try again with a registered email.");
            } else {
                setError(errorMessage);
            }
            setIsLoading(false);
        }
    };

    const styles = {
        settingsContainer: {
            width: "80%",
            margin: "8rem auto 0 auto",
            padding: "5rem 5rem",
            backgroundColor: "#f2f5f7",
            borderRadius: "8px",
            position: "relative",
        },
        settingsHeading: {
            textAlign: "center",
            color: "#2d573f",
            fontWeight: "bold",
            fontStyle: "italic",
            fontSize: "2rem",
            fontFamily: "'Georgia', serif",
            marginBottom: "2.5rem",
            position: "relative",
            top: "-2rem",
            letterSpacing: "0.05rem",
            textTransform: "capitalize",
            borderBottom: "2px solid #7ca38e",
            paddingBottom: "0.5rem",
        },
        settingItem: {
            marginBottom: "2rem",
        },
        settingBtn: {
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            backgroundColor: "#d9e4dc",
            border: "1px solid #7ca38e",
            color: "#2d573f",
            cursor: "pointer",
            textAlign: "left",
            borderRadius: "5px",
            transition: "background-color 0.3s ease",
        },
        settingContent: {
            padding: "1rem",
            marginTop: "0.5rem",
            backgroundColor: "#f8f9fa",
            borderLeft: "4px solid #7ca38e",
            borderRadius: "5px",
        },
        passwordInput: {
            width: "100%",
            padding: "0.5rem",
            margin: "0.5rem 0",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #7ca38e",
        },
        buttonGroup: {
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginTop: "1.5rem",
            width: "100%",
        },
        cancelBtn: {
            backgroundColor: "#d9534f",
            color: "white",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            width: "20%",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
        submitBtn: {
            backgroundColor: "#7ca38e",
            color: "white",
            padding: "0.75rem 2rem",
            fontSize: "1.1rem",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            width: "30%",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
        },
    };

    return (
        <>
            <Header />
            <div style={styles.settingsContainer}>
                <p style={styles.settingsHeading}>Settings</p>

                {/* Password section */}
                <div style={styles.settingItem}>
                    <button
                        style={styles.settingBtn}
                        onClick={() => toggleSection("password")}
                    >
                        Reset Password
                    </button>
                    {isPasswordOpen && (
                        <div style={styles.settingContent}>
                            <form onSubmit={handleEmailSubmit}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <Input
                                        type="email"
                                        id="email-address"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={styles.passwordInput}
                                        required
                                    />
                                    {error && <p style={{ color: "red" }}>{error}</p>}
                                </div>
                                <div style={styles.buttonGroup}>
                                    <Button type="submit" disabled={isLoading} style={styles.submitBtn}>
                                        {isLoading ? <CustomLoader /> : "Reset Password"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Account management section */}
                <div style={styles.settingItem}>
                    <button
                        style={styles.settingBtn}
                        onClick={() => toggleSection("account")}
                    >
                        Manage Your Account
                    </button>
                    {isAccountOpen && (
                        <div style={styles.settingContent}>
                            <div style={styles.buttonGroup}>
                                <button
                                    type="button"
                                    style={styles.cancelBtn}
                                    onClick={handleLogOut}
                                >
                                    Log Out
                                </button>
                                <button type="button" style={styles.submitBtn} onClick={handleDeleteAccount}>
                                    {isLoading ? <CustomLoader /> : "Delete Your Account"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notification preferences section */}
                <div style={styles.settingItem}>
                    <button
                        style={styles.settingBtn}
                        onClick={() => toggleSection("notification")}
                    >
                        Notification Preferences
                    </button>
                    {isNotificationOpen && (
                        <div style={styles.settingContent}>
                            <div style={styles.buttonGroup}>
                                <Input type="checkbox" id="notification" />
                                <label htmlFor="notification">
                                    Notification for mentions?
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Settings;
