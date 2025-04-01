"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Instagram } from "lucide-react";
import Image from "next/image";
import Logo from "../../../assets/logo.jpg";

// TypeScript interfaces
interface FormData {
    name: string;
    phoneNumber: string;
    position: string;
    age: string;
}

interface FormErrors {
    name?: string;
    phoneNumber?: string;
    position?: string;
    age?: string;
}

interface Position {
    code: string;
    name: string;
    category: string;
}

export default function RegistrationPage() {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        phoneNumber: "",
        position: "",
        age: "",
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        // Check if user has already registered
        const hasRegistered = localStorage.getItem("cpl_registered");
        if (hasRegistered) {
            setIsSubmitted(true);
        }
    }, []);

    const positions: Position[] = [
        { code: "GK", name: "Goalkeeper (GK)", category: "Goalkeeper" },
        { code: "CB", name: "Center Back (CB)", category: "Defenders" },
        { code: "RB", name: "Right Back (RB)", category: "Defenders" },
        { code: "LB", name: "Left Back (LB)", category: "Defenders" },
        {
            code: "CDM",
            name: "Central Defensive Midfielder (CDM)",
            category: "Midfielders",
        },
        {
            code: "CM",
            name: "Central Midfielder (CM)",
            category: "Midfielders",
        },
        {
            code: "CAM",
            name: "Central Attacking Midfielder (CAM)",
            category: "Midfielders",
        },
        { code: "RW", name: "Right Winger (RW)", category: "Forwards" },
        { code: "LW", name: "Left Winger (LW)", category: "Forwards" },
        { code: "CF", name: "Center Forward (CF)", category: "Forwards" },
    ];

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePositionSelect = (position: string): void => {
        setFormData((prev) => ({
            ...prev,
            position,
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.phoneNumber.trim())
            newErrors.phoneNumber = "Phone number is required";
        else if (!/^\d{10}$/.test(formData.phoneNumber))
            newErrors.phoneNumber = "Enter a valid 10-digit phone number";
        if (!formData.position) newErrors.position = "Position is required";
        if (!formData.age.trim()) newErrors.age = "Age is required";
        else {
            const age = parseInt(formData.age, 10);
            if (isNaN(age) || age < 15 || age > 50)
                newErrors.age = "Age must be between 15 and 50";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) return;

        // Show loading state
        // You could add a loading state if needed
        // setIsLoading(true);

        try {
            // Prepare form data for the API
            const formDataToSubmit = new FormData();
            formDataToSubmit.append("name", formData.name);
            formDataToSubmit.append("phoneNumber", formData.phoneNumber);
            formDataToSubmit.append("position", formData.position);
            formDataToSubmit.append("age", formData.age);

            // Submit to Google Sheets API
            const response = await fetch(
                "https://script.google.com/macros/s/AKfycbyXVSZ0KHZV3cM2QyLTd-8e1eqDfkiLFGY6pe6TJldVnNYPqylydA6J1o4YczX-iPegOg/exec",
                {
                    method: "POST",
                    body: formDataToSubmit,
                    mode: "no-cors", // This is necessary for Google Apps Script
                }
            );

            console.log(response, "Registration data submitted:", formData);

            // Store in localStorage to prevent re-registration
            localStorage.setItem("cpl_registered", "true");
            localStorage.setItem("cpl_user_data", JSON.stringify(formData));

            // Show success popup
            setShowSuccessPopup(true);
            setIsSubmitted(true);

            // Hide popup after 3 seconds
            setTimeout(() => {
                setShowSuccessPopup(false);
            }, 3000);
        } catch (error) {
            console.error("Error submitting form:", error);
            // You could show an error message to the user here
            // setErrorMessage('Failed to submit registration. Please try again.');
        } finally {
            // Hide loading state if you added one
            // setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 text-white">
            {/* Header with Logo */}
            <header className="p-4 flex flex-col items-center">
                <div className="w-40 h-40 p-2 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-36 h-36 relative overflow-hidden rounded-full bg-green-700 flex items-center justify-center border-4 border-yellow-500">
                        <Image src={Logo} alt="Logo" fill />
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 max-w-md">
                {!isSubmitted ? (
                    <>
                        <h2 className="text-2xl font-bold text-center mb-6">
                            Player Registration
                        </h2>
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-lg"
                        >
                            <div className="mb-4">
                                <label className="block mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full p-2 rounded bg-white/20 border ${
                                        errors.name
                                            ? "border-red-500"
                                            : "border-transparent"
                                    }`}
                                />
                                {errors.name && (
                                    <p className="text-red-300 text-sm mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block mb-1">Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    min="15"
                                    max="50"
                                    className={`w-full p-2 rounded bg-white/20 border ${
                                        errors.age
                                            ? "border-red-500"
                                            : "border-transparent"
                                    }`}
                                />
                                {errors.age && (
                                    <p className="text-red-300 text-sm mt-1">
                                        {errors.age}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    className={`w-full p-2 rounded bg-white/20 border ${
                                        errors.phoneNumber
                                            ? "border-red-500"
                                            : "border-transparent"
                                    }`}
                                />
                                {errors.phoneNumber && (
                                    <p className="text-red-300 text-sm mt-1">
                                        {errors.phoneNumber}
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1">Position</label>
                                {errors.position && (
                                    <p className="text-red-300 text-sm mb-1">
                                        {errors.position}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {[
                                        "Goalkeeper",
                                        "Defenders",
                                        "Midfielders",
                                        "Forwards",
                                    ].map((category) => (
                                        <div key={category}>
                                            <h3 className="text-yellow-300 font-semibold">
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                {positions
                                                    .filter(
                                                        (pos) =>
                                                            pos.category ===
                                                            category
                                                    )
                                                    .map((position) => (
                                                        <button
                                                            key={position.code}
                                                            type="button"
                                                            onClick={() =>
                                                                handlePositionSelect(
                                                                    position.code
                                                                )
                                                            }
                                                            className={`p-2 text-sm rounded border border-white/30 hover:bg-green-600 transition-colors
                                ${
                                    formData.position === position.code
                                        ? "bg-green-600 font-bold"
                                        : "bg-white/10"
                                }`}
                                                        >
                                                            {position.name}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-green-900 font-bold py-3 px-4 rounded transition-colors"
                            >
                                Register Now
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg shadow-lg text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                            Already Registered!
                        </h2>
                        <p>
                            You have already registered for the Chennarathadam
                            Premier League.
                        </p>
                    </div>
                )}

                {/* Follow Section */}
                <div className="mt-12 text-center">
                    <h3 className="font-semibold mb-3">Follow CPL</h3>
                    <a
                        href="https://www.instagram.com/chennarathadampremierleague"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-3 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Instagram size={24} className="mr-2" />
                        <span className="font-medium">
                            @chennarathadampremierleague
                        </span>
                    </a>
                </div>
            </div>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
                    <div className="bg-white text-green-900 p-6 rounded-lg shadow-xl max-w-md mx-4 animate-fade-in">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-center">
                            Registration Successful!
                        </h2>
                        <p className="text-center">
                            Thank you for registering with Chennarathadam
                            Premier League. We&apos;ll contact you soon!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
