import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DynamicForm from "./DynamicForm";
import { describe, it, expect, vi } from "vitest";

describe("DynamicForm", () => {
  const baseFields = [
    { id: "firstName", label: "First Name", type: "text", required: true },
    { id: "role", label: "Role", type: "select", options: [ { label: "Admin", value: "admin" }, { label: "User", value: "user" } ], required: true },
    { id: "gender", label: "Gender", type: "radio", options: [ { label: "M", value: "M" }, { label: "F", value: "F" } ], required: true },
    { id: "subscribe", label: "Subscribe", type: "checkbox" },
    { id: "dob", label: "Date of Birth", type: "date" },
    { id: "bio", label: "Bio", type: "textarea" },
    { id: "hiddenField", label: "Hidden", type: "hidden" },
    { id: "location", label: "Location", type: "map" },
    { id: "score", label: "Score", type: "slider", min: 0, max: 10 },
    { id: "tags", label: "Tags", type: "array" },
    { id: "meta", label: "Meta", type: "object" },
  ];

  it("renders all supported field types and stubs for advanced types", () => {
    render(<DynamicForm schema={baseFields} onSubmit={() => {}} />);
    // Text
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    // Select
    expect(screen.getByLabelText(/Role/)).toBeInTheDocument();
    // Radio
    expect(screen.getByText(/Gender/)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/M/)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/F/)[0]).toBeInTheDocument();
    // Checkbox
    expect(screen.getByLabelText(/Subscribe/)).toBeInTheDocument();
    // Date
    expect(screen.getByLabelText(/Date of Birth/)).toBeInTheDocument();
    // Textarea
    expect(screen.getByLabelText(/Bio/)).toBeInTheDocument();
    // Hidden (should be in the DOM but not visible)
    expect(screen.getAllByDisplayValue("")[0]).toBeInTheDocument();
    // Map stub
    expect(screen.getByText(/Map input not yet implemented/)).toBeInTheDocument();
    // Slider
    expect(screen.getByLabelText(/Score/)).toBeInTheDocument();
    // Array stub
    expect(screen.getByText(/Array input not yet implemented/)).toBeInTheDocument();
    // Object stub
    expect(screen.getByText(/Object input not yet implemented/)).toBeInTheDocument();
  });

  it("validates required fields and submits values", async () => {
    const handleSubmit = vi.fn();
    render(<DynamicForm schema={baseFields.slice(0, 3)} onSubmit={handleSubmit} />);
    // Try to submit with empty fields
    fireEvent.click(screen.getByText(/Submit/));
    expect(handleSubmit).not.toHaveBeenCalled();
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/First Name/), { target: { value: "Alice" } });
    fireEvent.change(screen.getByLabelText(/Role/), { target: { value: "admin" } });
    fireEvent.click(screen.getByLabelText(/M/));
    // Wait for form to be valid and submit
    await screen.findByLabelText(/First Name/);
    fireEvent.click(screen.getByText(/Submit/));
    await waitFor(() => {
      // Only check the first argument of the first call
      expect(handleSubmit).toHaveBeenCalled();
      const firstCallArgs = handleSubmit.mock.calls[0][0];
      expect(firstCallArgs).toEqual(
        expect.objectContaining({ firstName: "Alice", role: "admin", gender: "M" })
      );
    });
  });
}); 